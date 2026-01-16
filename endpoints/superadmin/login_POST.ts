import { db } from "../../helpers/db";
import { sql } from "kysely";
import { schema } from "./login_POST.schema";
import { compare } from "bcryptjs";
import { randomBytes } from "crypto";
import {
  setServerSession,
  SessionExpirationSeconds,
} from "../../helpers/getSetServerSession";
import { logSecurityEvent } from "../../helpers/securityAuditLogger";

// Stricter rate limiting for super admin
const RATE_LIMIT_CONFIG = {
  maxFailedAttempts: 5,
  lockoutWindowMinutes: 15,
  lockoutDurationMinutes: 30, // 30 minute lockout for super admin
  cleanupProbability: 0.1,
} as const;

function safeToDate(
  value: string | number | bigint | null | undefined
): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return new Date(Number(value));
  return new Date(value);
}

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { email, password } = schema.parse(json);

    const normalizedEmail = email.toLowerCase();
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - RATE_LIMIT_CONFIG.lockoutWindowMinutes * 60 * 1000
    );

    const result = await db.transaction().execute(async (trx) => {
      // Use advisory lock for rate limiting
      await sql`SELECT pg_advisory_xact_lock(hashtextextended(${`superadmin_${normalizedEmail}`},0))`.execute(
        trx
      );

      // Check rate limit
      const rateLimitQuery = await trx
        .selectFrom("loginAttempts")
        .select([
          trx.fn.countAll<number>().as("failedCount"),
          trx.fn.max(trx.dynamic.ref("attemptedAt")).as("lastFailedAt"),
        ])
        .where("email", "=", `superadmin_${normalizedEmail}`)
        .where("success", "=", false)
        .where("attemptedAt", ">=", windowStart)
        .where("attemptedAt", "is not", null)
        .executeTakeFirst();

      const { failedCount = 0, lastFailedAt = null } = rateLimitQuery || {};
      const safeLastFailedAt = safeToDate(lastFailedAt);

      if (
        rateLimitQuery &&
        failedCount >= RATE_LIMIT_CONFIG.maxFailedAttempts &&
        safeLastFailedAt
      ) {
        const lockoutEnd = new Date(
          safeLastFailedAt.getTime() +
            RATE_LIMIT_CONFIG.lockoutDurationMinutes * 60 * 1000
        );

        if (now < lockoutEnd) {
          const remainingMinutes = Math.ceil(
            (lockoutEnd.getTime() - now.getTime()) / (60 * 1000)
          );
          return { type: "rate_limited" as const, remainingMinutes };
        }
      }

      // Find super admin user
      const userResults = await trx
        .selectFrom("users")
        .innerJoin("userPasswords", "users.id", "userPasswords.userId")
        .select([
          "users.id",
          "users.email",
          "users.displayName",
          "users.avatarUrl",
          "users.isSuperAdmin",
          "userPasswords.passwordHash",
        ])
        .where(sql`LOWER(users.email)`, "=", normalizedEmail)
        .where("users.isSuperAdmin", "=", true)
        .limit(1)
        .execute();

      if (userResults.length === 0) {
        // Log failed attempt
        await trx
          .insertInto("loginAttempts")
          .values({
            email: `superadmin_${normalizedEmail}`,
            attemptedAt: now,
            success: false,
          })
          .execute();
        return { type: "auth_failed" as const, reason: "user_not_found" };
      }

      const user = userResults[0];

      // Verify password
      const passwordValid = await compare(password, user.passwordHash);
      if (!passwordValid) {
        await trx
          .insertInto("loginAttempts")
          .values({
            email: `superadmin_${normalizedEmail}`,
            attemptedAt: now,
            success: false,
          })
          .execute();
        return { type: "auth_failed" as const, reason: "invalid_password" };
      }

      // Success - log and create session
      await trx
        .insertInto("loginAttempts")
        .values({
          email: `superadmin_${normalizedEmail}`,
          attemptedAt: now,
          success: true,
        })
        .execute();

      // Invalidate previous sessions for this super admin
      await trx
        .deleteFrom("sessions")
        .where("userId", "=", user.id)
        .execute();

      // Create new session
      const sessionId = randomBytes(32).toString("hex");
      const expiresAt = new Date(
        now.getTime() + SessionExpirationSeconds * 1000
      );

      await trx
        .insertInto("sessions")
        .values({
          id: sessionId,
          userId: user.id,
          createdAt: now,
          lastAccessed: now,
          expiresAt: expiresAt,
        })
        .execute();

      // Clear failed attempts
      await trx
        .deleteFrom("loginAttempts")
        .where("email", "=", `superadmin_${normalizedEmail}`)
        .where("success", "=", false)
        .execute();

      return {
        type: "success" as const,
        user,
        sessionId,
        sessionCreatedAt: now,
      };
    });

    // Handle results
    if (result.type === "rate_limited") {
      await logSecurityEvent({
        eventType: "superadmin_login_failed",
        email: normalizedEmail,
        request,
        details: { reason: "rate_limited" },
      });
      return Response.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many attempts. Please wait before trying again.",
          },
        },
        { status: 429 }
      );
    }

    if (result.type === "auth_failed") {
      await logSecurityEvent({
        eventType: "superadmin_login_failed",
        email: normalizedEmail,
        request,
        details: { reason: result.reason },
      });
      return Response.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        },
        { status: 401 }
      );
    }

    // Success
    const user = result.user;
    await logSecurityEvent({
      eventType: "superadmin_login",
      email: user.email,
      userId: user.id,
      request,
    });

    const response = Response.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isSuperAdmin: true,
        organizationId: null,
        role: "admin" as const,
        oauthProvider: null,
        hasLoggedIn: true,
      },
    });

    await setServerSession(response, {
      id: result.sessionId,
      createdAt: result.sessionCreatedAt.getTime(),
      lastAccessed: result.sessionCreatedAt.getTime(),
    });

    return response;
  } catch (error) {
    console.error("Super admin login error:", error);
    return Response.json(
      {
        error: {
          code: "AUTH_ERROR",
          message: "Authentication failed",
        },
      },
      { status: 400 }
    );
  }
}
