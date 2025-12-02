import { db } from './db';
import type { Json } from './schema';
import type { AuditLogAction } from '../endpoints/policies/audit_GET.schema';

/**
 * Parameters for logging a policy audit action.
 */
interface LogPolicyActionParams {
  /** The ID of the policy being acted upon. */
  policyId: number;
  /** The name/title of the policy. */
  policyName:string;
  /** The organization ID that owns the policy. */
  organizationId: number;
  /** A description of the action being performed (e.g., 'Policy Created', 'Policy Updated'). */
  action: AuditLogAction;
  /** The ID of the user performing the action. */
  actionBy: number;
  /** Optional JSON object containing additional details about the action (e.g., changed fields). */
  details?: Json | null;
  /** The incoming Request object, used to extract IP address and user agent. */
  request: Request;
}

/**
 * Logs an action related to a policy to the `policy_audit_log` table.
 * This function is designed to be called from policy-related endpoints.
 * It handles database insertion and includes error handling.
 *
 * @param params - The parameters for the audit log entry.
 */
export const logPolicyAction = async ({
  policyId,
  policyName,
  organizationId,
  action,
  actionBy,
  details = null,
  request,
}: LogPolicyActionParams): Promise<void> => {
  try {
    // Attempt to get the client's real IP address from common proxy headers.
    const ipAddress = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    await db
      .insertInto('policyAuditLog')
      .values({
        policyId,
        policyName,
        organizationId,
        action,
        actionBy,
        details,
        ipAddress: ipAddress,
        userAgent: userAgent,
      })
      .execute();

    console.log(`Successfully logged audit action: "${action}" for policy "${policyName}" (ID: ${policyId}) by user ${actionBy}`);

  } catch (error) {
    console.error('Failed to log policy audit action:', {
      policyId,
      action,
      actionBy,
      error: error instanceof Error ? error.message : String(error),
    });
    // We intentionally do not re-throw the error.
    // A failure in audit logging should not prevent the primary operation (e.g., updating a policy) from succeeding.
  }
};