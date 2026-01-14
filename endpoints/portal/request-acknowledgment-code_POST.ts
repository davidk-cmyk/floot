import { db } from "../../helpers/db";
import { schema, OutputType } from "./request-acknowledgment-code_POST.schema";
import { sendConfirmationCodeEmail } from "../../helpers/emailService";
import superjson from "superjson";
import { subHours } from "date-fns";
import {
  checkRateLimit,
  recordRateLimitAttempt,
  RATE_LIMIT_CONFIGS,
} from "../../helpers/rateLimiter";
import { generateConfirmationCode, getCodeExpiration } from "../../helpers/generateConfirmationCode";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { portalSlug, policyId, email } = schema.parse(json);

    const lowercasedEmail = email.toLowerCase().trim();

    // Rate limiting check to prevent email bombing
    // Use passwordReset config as it has similar requirements (3 requests per 60 minutes)
    const rateLimitResult = await checkRateLimit(lowercasedEmail, 'passwordReset', RATE_LIMIT_CONFIGS.passwordReset);
    if (!rateLimitResult.allowed) {
      return new Response(
        superjson.stringify({
          success: false,
          message: `Too many code requests. Please try again in ${rateLimitResult.remainingMinutes} minutes.`,
        } satisfies OutputType),
        { status: 429 }
      );
    }

    const portal = await db
      .selectFrom("portals")
      .select(["id", "accessType", "organizationId"])
      .where("slug", "=", portalSlug)
      .where("isActive", "=", true)
      .orderBy("id", "desc")
      .executeTakeFirst();

    if (!portal) {
      return new Response(
        superjson.stringify({
          success: false,
          message: "Portal not found or is not active.",
        } satisfies OutputType),
        { status: 404 }
      );
    }

    if (portal.accessType !== "password") {
      return new Response(
        superjson.stringify({
          success: false,
          message: "This acknowledgment method is only for password-protected portals.",
        } satisfies OutputType),
        { status: 400 }
      );
    }

    const policy = await db
      .selectFrom("policies")
      .select("id")
      .where("id", "=", policyId)
      .where("organizationId", "=", portal.organizationId)
      .executeTakeFirst();

    if (!policy) {
      return new Response(
        superjson.stringify({
          success: false,
          message: "Policy not found.",
        } satisfies OutputType),
        { status: 404 }
      );
    }

    const recipient = await db
      .selectFrom("portalEmailRecipients")
      .where("portalId", "=", portal.id)
      .where("email", "ilike", lowercasedEmail)
      .executeTakeFirst();

    if (!recipient) {
      return new Response(
        superjson.stringify({
          success: false,
          message: "Email not found in the acknowledgment list for this portal.",
        } satisfies OutputType),
        { status: 403 }
      );
    }

    const code = generateConfirmationCode();
    const expiresAt = getCodeExpiration();

    // Invalidate any previous unused codes for this email/portal/policy combination
    await db
      .updateTable("acknowledgmentConfirmationCodes")
      .set({ used: true })
      .where("portalId", "=", portal.id)
      .where("policyId", "=", policy.id)
      .where("email", "ilike", lowercasedEmail)
      .where("used", "=", false)
      .execute();

    await db
      .insertInto("acknowledgmentConfirmationCodes")
      .values({
        portalId: portal.id,
        policyId: policy.id,
        email: lowercasedEmail,
        code,
        expiresAt,
      })
      .execute();

    try {
      await sendConfirmationCodeEmail(lowercasedEmail, code);
    } catch (emailError) {
      console.error("Failed to send acknowledgment code email:", emailError);
      // Don't expose email error to client
    }

    // Record rate limit attempt after processing
    await recordRateLimitAttempt(lowercasedEmail, 'passwordReset');

    // Probabilistic cleanup of expired codes (10% chance)
    if (Math.random() < 0.1) {
      const cleanupBefore = subHours(new Date(), 24);
      try {
        await db
          .deleteFrom("acknowledgmentConfirmationCodes")
          .where("expiresAt", "<", cleanupBefore)
          .execute();
      } catch {
        // Ignore cleanup errors
      }
    }

    return new Response(
      superjson.stringify({
        success: true,
        message: "A confirmation code has been sent to your email.",
      } satisfies OutputType),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error requesting acknowledgment code:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(superjson.stringify({ success: false, message }), {
      status: 400,
    });
  }
}