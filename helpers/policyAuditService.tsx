import { logPolicyAction } from './policyAuditLogger';
import { buildJsonSafeCopy } from './policyJsonService';
import { Json } from './schema';
import { User } from './User';

/**
 * Logs the creation of a new policy.
 *
 * @param policy - The newly created policy object.
 * @param user - The user who created the policy.
 * @param request - The original Request object.
 */
export const auditPolicyCreation = async (
  policy: { id: number; title: string; department: string | null; category: string | null },
  user: User,
  request: Request
): Promise<void> => {
  await logPolicyAction({
    policyId: policy.id,
    policyName: policy.title,
    organizationId: user.organizationId,
    action: 'create',
    actionBy: user.id,
    details: {
      department: policy.department,
      category: policy.category,
    },
    request,
  });
};

/**
 * Logs the update of an existing policy. It identifies which fields were changed
 * and uses the policyJsonService to ensure the details are safely stored as JSON.
 *
 * @param updatedPolicy - The policy object after the update.
 * @param updateData - The raw data object containing the fields that were updated.
 * @param changeSummary - An optional summary of the changes.
 * @param user - The user who performed the update.
 * @param request - The original Request object.
 */
export const auditPolicyUpdate = async (
  updatedPolicy: { id: number; title: string; currentVersion: number | null },
  updateData: Record<string, any>,
  changeSummary: string | null | undefined,
  user: User,
  request: Request
): Promise<void> => {
  const changedFields = Object.keys(updateData);
  const jsonSafeChanges = buildJsonSafeCopy(updateData);

  const auditDetails: Record<string, any> = {
    changedFields,
    changeSummary: changeSummary || null,
    newVersion: updatedPolicy.currentVersion,
    changes: jsonSafeChanges,
  };

  await logPolicyAction({
    policyId: updatedPolicy.id,
    policyName: updatedPolicy.title,
    organizationId: user.organizationId,
    action: 'edit',
    actionBy: user.id,
    details: auditDetails as Json,
    request,
  });
};