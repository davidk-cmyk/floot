import { db } from './db';
import type { Json } from './schema';

/**
 * Security audit event types for tracking authentication and security-related actions.
 */
export type SecurityEventType =
  | 'password_reset_request'
  | 'password_reset_success'
  | 'password_reset_failed'
  | 'password_reset_locked'
  | 'code_verification_failed'
  | 'code_verification_locked'
  | 'login_failed'
  | 'login_locked'
  | 'account_locked';

/**
 * Parameters for logging a security audit event.
 */
interface LogSecurityEventParams {
  /** The type of security event. */
  eventType: SecurityEventType;
  /** The email address associated with the event (if applicable). */
  email?: string | null;
  /** The user ID associated with the event (if applicable). */
  userId?: number | null;
  /** The incoming Request object, used to extract IP address and user agent. */
  request?: Request | null;
  /** Optional JSON object containing additional details about the event. */
  details?: Json | null;
}

/**
 * Extracts IP address from request headers.
 * Checks common proxy headers first, then falls back to direct connection info.
 */
function getIpAddress(request: Request | null | undefined): string | null {
  if (!request) return null;
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null;
}

/**
 * Extracts user agent from request headers.
 */
function getUserAgent(request: Request | null | undefined): string | null {
  if (!request) return null;
  return request.headers.get('user-agent');
}

/**
 * Logs a security audit event to the `security_audit_log` table.
 * This function is designed to be called from authentication-related endpoints.
 * It handles database insertion and includes error handling.
 *
 * A failure in audit logging should not prevent the primary operation from succeeding.
 *
 * @param params - The parameters for the audit log entry.
 */
export async function logSecurityEvent({
  eventType,
  email = null,
  userId = null,
  request = null,
  details = null,
}: LogSecurityEventParams): Promise<void> {
  try {
    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);

    await db
      .insertInto('securityAuditLog')
      .values({
        eventType,
        email,
        userId,
        ipAddress,
        userAgent,
        details,
      })
      .execute();

    console.log(`Security audit: ${eventType} for ${email ?? userId ?? 'unknown'}`);
  } catch (error) {
    console.error('Failed to log security audit event:', {
      eventType,
      email,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Intentionally do not re-throw the error.
    // A failure in audit logging should not prevent the primary operation from succeeding.
  }
}

/**
 * Helper to log password reset request events.
 */
export async function logPasswordResetRequest(
  email: string,
  request: Request,
  success: boolean = true
): Promise<void> {
  await logSecurityEvent({
    eventType: 'password_reset_request',
    email,
    request,
    details: { success },
  });
}

/**
 * Helper to log password reset success events.
 */
export async function logPasswordResetSuccess(
  email: string,
  userId: number,
  request: Request
): Promise<void> {
  await logSecurityEvent({
    eventType: 'password_reset_success',
    email,
    userId,
    request,
  });
}

/**
 * Helper to log password reset failed events.
 */
export async function logPasswordResetFailed(
  email: string,
  request: Request,
  reason: string
): Promise<void> {
  await logSecurityEvent({
    eventType: 'password_reset_failed',
    email,
    request,
    details: { reason },
  });
}

/**
 * Helper to log code verification lockout events.
 */
export async function logCodeVerificationLocked(
  email: string,
  request: Request,
  attemptCount: number
): Promise<void> {
  await logSecurityEvent({
    eventType: 'code_verification_locked',
    email,
    request,
    details: { attemptCount },
  });
}
