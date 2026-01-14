import { db } from "../../helpers/db";
import { schema, OutputType } from "./confirm-password-reset_POST.schema";
import { hash } from "bcryptjs";
import {
  checkRateLimit,
  recordRateLimitAttempt,
  clearRateLimitAttempts,
} from "../../helpers/rateLimiter";
import { logSecurityEvent } from "../../helpers/securityAuditLogger";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { email, code, newPassword } = schema.parse(json);

    const normalizedEmail = email.toLowerCase().trim();

    // Brute-force protection: check rate limit before validating code
    const rateLimitResult = await checkRateLimit(normalizedEmail, 'codeVerification');
    if (!rateLimitResult.allowed) {
      // Log lockout event
      await logSecurityEvent({
        eventType: 'code_verification_locked',
        email: normalizedEmail,
        request,
        details: { remainingMinutes: rateLimitResult.remainingMinutes },
      });
      return Response.json(
        {
          success: false,
          message: `Too many failed attempts. Please try again in ${rateLimitResult.remainingMinutes} minutes.`,
        } satisfies OutputType,
        { status: 429 }
      );
    }

    const resetCode = await db
      .selectFrom("passwordResetCodes")
      .selectAll()
      .where("email", "ilike", normalizedEmail)
      .where("code", "=", code)
      .where("used", "=", false)
      .orderBy("createdAt", "desc")
      .executeTakeFirst();

    if (!resetCode) {
      // Record failed attempt for brute-force protection
      await recordRateLimitAttempt(normalizedEmail, 'codeVerification');
      // Log failed verification attempt
      await logSecurityEvent({
        eventType: 'password_reset_failed',
        email: normalizedEmail,
        request,
        details: { reason: 'invalid_code' },
      });
      return Response.json(
        {
          success: false,
          message: "Invalid or expired reset code.",
        } satisfies OutputType,
        { status: 400 }
      );
    }

    if (new Date() > new Date(resetCode.expiresAt)) {
      // Record failed attempt for brute-force protection
      await recordRateLimitAttempt(normalizedEmail, 'codeVerification');
      // Log failed verification attempt
      await logSecurityEvent({
        eventType: 'password_reset_failed',
        email: normalizedEmail,
        request,
        details: { reason: 'code_expired' },
      });
      return Response.json(
        {
          success: false,
          message: "Reset code has expired. Please request a new one.",
        } satisfies OutputType,
        { status: 400 }
      );
    }

    const passwordHash = await hash(newPassword, 12);

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("passwordResetCodes")
        .set({ used: true })
        .where("id", "=", resetCode.id)
        .execute();

      await trx
        .updateTable("userPasswords")
        .set({ passwordHash })
        .where("userId", "=", resetCode.userId)
        .execute();

      // Invalidate all existing sessions for this user (force re-login on all devices)
      await trx
        .deleteFrom("sessions")
        .where("userId", "=", resetCode.userId)
        .execute();
    });

    // Clear rate limit attempts on successful password reset
    await clearRateLimitAttempts(normalizedEmail, 'codeVerification');

    // Log successful password reset
    await logSecurityEvent({
      eventType: 'password_reset_success',
      email: normalizedEmail,
      userId: resetCode.userId,
      request,
    });

    return Response.json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    } satisfies OutputType);
  } catch (error) {
    console.error("Error confirming password reset:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return Response.json(
      { success: false, message } satisfies OutputType,
      { status: 400 }
    );
  }
}
