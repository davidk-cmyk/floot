import { db } from "../../helpers/db";
import { schema, OutputType } from "./request-password-reset_POST.schema";
import { sendPasswordResetEmail } from "../../helpers/emailService";
import { subHours } from "date-fns";
import {
  checkRateLimit,
  recordRateLimitAttempt,
} from "../../helpers/rateLimiter";
import { logSecurityEvent } from "../../helpers/securityAuditLogger";
import { generateConfirmationCode, getCodeExpiration } from "../../helpers/generateConfirmationCode";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { email } = schema.parse(json);

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting check to prevent email bombing
    const rateLimitResult = await checkRateLimit(normalizedEmail, 'passwordReset');
    if (!rateLimitResult.allowed) {
      // Log rate limit lockout event
      await logSecurityEvent({
        eventType: 'password_reset_locked',
        email: normalizedEmail,
        request,
        details: { remainingMinutes: rateLimitResult.remainingMinutes },
      });
      return Response.json(
        {
          success: false,
          message: `Too many password reset requests. Please try again in ${rateLimitResult.remainingMinutes} minutes.`,
        } satisfies OutputType,
        { status: 429 }
      );
    }

    const user = await db
      .selectFrom("users")
      .innerJoin("userPasswords", "users.id", "userPasswords.userId")
      .select(["users.id", "users.email"])
      .where("users.email", "ilike", normalizedEmail)
      .executeTakeFirst();

    if (!user) {
      return Response.json({
        success: true,
        message: "If an account exists with this email, a reset code has been sent.",
      } satisfies OutputType);
    }

    const code = generateConfirmationCode();
    const expiresAt = getCodeExpiration();

    // Invalidate any previous unused codes for this email
    await db
      .updateTable("passwordResetCodes")
      .set({ used: true })
      .where("email", "ilike", normalizedEmail)
      .where("used", "=", false)
      .execute();

    await db
      .insertInto("passwordResetCodes")
      .values({
        userId: user.id,
        email: normalizedEmail,
        code,
        expiresAt,
      })
      .execute();

    let emailSent = false;
    try {
      await sendPasswordResetEmail(normalizedEmail, code);
      emailSent = true;
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Don't reveal account existence - still return success message
      // The error is logged for debugging but not exposed to the client
    }

    // Log password reset request event
    await logSecurityEvent({
      eventType: 'password_reset_request',
      email: normalizedEmail,
      userId: user.id,
      request,
      details: { emailSent },
    });

    // Record rate limit attempt after processing (whether email sent or not)
    await recordRateLimitAttempt(normalizedEmail, 'passwordReset');

    // Probabilistic cleanup of expired codes (10% chance)
    if (Math.random() < 0.1) {
      const cleanupBefore = subHours(new Date(), 24);
      try {
        await db
          .deleteFrom("passwordResetCodes")
          .where("expiresAt", "<", cleanupBefore)
          .execute();
      } catch {
        // Ignore cleanup errors
      }
    }

    return Response.json({
      success: true,
      message: "If an account exists with this email, a reset code has been sent.",
    } satisfies OutputType);
  } catch (error) {
    console.error("Error requesting password reset:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return Response.json(
      { success: false, message } satisfies OutputType,
      { status: 400 }
    );
  }
}
