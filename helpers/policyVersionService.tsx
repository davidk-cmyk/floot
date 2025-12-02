import { createVersionSnapshot } from './policyVersionHelper';
import { Selectable } from 'kysely';
import { Policies } from './schema';
import { User } from './User';

/**
 * Creates a version snapshot for a policy. This is typically called after a policy
 * has been successfully created or updated.
 * This function is designed to be non-blocking; it will log any errors that occur
 * during snapshot creation but will not throw them, ensuring that the primary
 * database operation (like a policy update) is not rolled back due to a
 * versioning failure.
 *
 * @param policy - The full policy object to be versioned.
 * @param user - The user responsible for this version.
 * @param changeSummary - An optional summary of what changed in this version.
 */
export const recordPolicyVersion = async (
  policy: Selectable<Policies>,
  user: User,
  changeSummary?: string | null
): Promise<void> => {
  try {
    await createVersionSnapshot({
      policyId: policy.id,
      organizationId: user.organizationId,
      versionNumber: policy.currentVersion ?? 1,
      createdBy: user.id,
      title: policy.title,
      content: policy.content,
      status: policy.status,
      changeSummary: changeSummary || null,
      effectiveDate: policy.effectiveDate,
      expirationDate: policy.expirationDate,
      reviewDate: policy.reviewDate,
      tags: policy.tags,
      department: policy.department,
      category: policy.category,
    });
  } catch (error) {
    console.error('Failed to record policy version snapshot:', {
      policyId: policy.id,
      version: policy.currentVersion,
      error: error instanceof Error ? error.message : String(error),
    });
    // Do not re-throw. A failure in versioning should not fail the main operation.
  }
};