// adapt this to the database schema and helpers if necessary
import { db } from "../../helpers/db";
import { schema } from "./register_with_password_POST.schema";
import { randomBytes } from "crypto";
import {
  setServerSession,
  SessionExpirationSeconds,
} from "../../helpers/getSetServerSession";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";
import { isStringArray } from "../../helpers/jsonTypeGuards";
import {
  checkRateLimit,
  recordRateLimitAttempt,
  clearRateLimitAttempts,
} from "../../helpers/rateLimiter";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { email, password, displayName, organizationSlug } = schema.parse(json);

    // Rate limiting check based on email to prevent abuse
    const rateLimitResult = await checkRateLimit(email, 'registration');
    if (!rateLimitResult.allowed) {
      return Response.json(
        {
          message: `Too many registration attempts. Please try again in ${rateLimitResult.remainingMinutes} minutes.`,
        },
        { status: 429 }
      );
    }

    // Record the attempt for rate limiting
    await recordRateLimitAttempt(email, 'registration');

    // Check if email already exists
    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", email)
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      return Response.json(
        { message: "email already in use" },
        { status: 409 }
      );
    }

    // Extract email domain
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (!emailDomain) {
      return Response.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get organization to check for domain whitelist
    const organization = await db
      .selectFrom("organizations")
      .select("id")
      .where("slug", "=", organizationSlug)
      .where("isActive", "=", true)
      .limit(1)
      .executeTakeFirst();

    if (!organization) {
      return Response.json(
        {
          message: `Organization '${organizationSlug}' not found. Please contact your administrator or create a new organization first.`,
        },
        { status: 404 }
      );
    }

    // Check for whitelisted domains setting
    const whitelistSetting = await db
      .selectFrom("settings")
      .select(["settingValue"])
      .where("organizationId", "=", organization.id)
      .where("settingKey", "=", "whitelisted_domains")
      .executeTakeFirst();

    if (whitelistSetting?.settingValue) {
      let whitelistedDomains: string[] | null = null;

      // Handle case where settingValue might be a JSON string
      if (typeof whitelistSetting.settingValue === "string") {
        try {
          const parsed = JSON.parse(whitelistSetting.settingValue);
          if (isStringArray(parsed)) {
            whitelistedDomains = parsed;
          }
        } catch {
          // If parsing fails, treat as invalid whitelist
          console.error("Failed to parse whitelisted_domains setting");
        }
      } else if (isStringArray(whitelistSetting.settingValue)) {
        whitelistedDomains = whitelistSetting.settingValue;
      }

      // If whitelist exists and is not empty, validate the domain
      if (whitelistedDomains && whitelistedDomains.length > 0) {
        const normalizedWhitelist = whitelistedDomains.map((d) =>
          d.toLowerCase()
        );
        if (!normalizedWhitelist.includes(emailDomain)) {
          return Response.json(
            {
              message:
                "Registration is restricted. Your email domain is not authorized for this organization.",
            },
            { status: 403 }
          );
        }
      }
    }

    const passwordHash = await generatePasswordHash(password);

    // Create new user
    const newUser = await db.transaction().execute(async (trx) => {
      const organizationId = organization.id;

      // Insert the user
      const [user] = await trx
        .insertInto("users")
        .values({
          email,
          displayName,
          role: "user", // Default role
          organizationId,
          hasLoggedIn: false, // New users haven't logged in yet
        })
        .returning(["id", "email", "displayName", "createdAt", "organizationId"])
        .execute();

      // Store the password hash in another table
      await trx
        .insertInto("userPasswords")
        .values({
          userId: user.id,
          passwordHash,
        })
        .execute();

      return user;
    });

    // Create a new session
    const sessionId = randomBytes(32).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SessionExpirationSeconds * 1000);

    await db
      .insertInto("sessions")
      .values({
        id: sessionId,
        userId: newUser.id,
        createdAt: now,
        lastAccessed: now,
        expiresAt,
      })
      .execute();

    // Clear rate limit attempts on successful registration
    await clearRateLimitAttempts(email, 'registration');

    // Create response with user data
    const response = Response.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        avatarUrl: null, // New users don't have avatars initially
        role: "user" as const,
        organizationId: newUser.organizationId,
        oauthProvider: null, // Password-based registration
        hasLoggedIn: false, // New users haven't logged in yet (this is registration)
      },
      isFirstLogin: true, // Registration is always the first time for a user
    });

    // Set session cookie
    await setServerSession(response, {
      id: sessionId,
      createdAt: now.getTime(),
      lastAccessed: now.getTime(),
    });

    return response;
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";
    return Response.json({ message: errorMessage }, { status: 400 });
  }
}
