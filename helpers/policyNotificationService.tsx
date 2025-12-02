import { db } from './db';
import { createNotification, createPolicyAssignmentNotification } from './notificationHelpers';
import { Selectable } from 'kysely';
import { Policies } from './schema';
import { User } from './User';

/**
 * Sends notifications after a new policy is created.
 * The logic is role-based:
 * - If an 'editor' creates a policy, 'admins' are notified for approval.
 * - If an 'admin' creates a policy, other users in the organization are notified about the new policy.
 *
 * @param policy - The newly created policy object.
 * @param creator - The user object of the person who created the policy.
 */
export const sendPolicyCreationNotifications = async (
  policy: Selectable<Policies>,
  creator: User
): Promise<void> => {
  try {
    if (creator.role === 'editor') {
      // Notify admins for approval
      const admins = await db
        .selectFrom('users')
        .select(['id'])
        .where('role', '=', 'admin')
        .where('organizationId', '=', creator.organizationId)
        .execute();

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          organizationId: creator.organizationId,
          type: 'approval_request',
          title: 'Policy Approval Required',
          message: `${creator.displayName} has created a new policy "${policy.title}" that requires your approval.`,
          relatedPolicyId: policy.id,
        });
      }
    } else if (creator.role === 'admin') {
      // Notify other users about the new policy
      const otherUsers = await db
        .selectFrom('users')
        .select(['id'])
        .where('organizationId', '=', creator.organizationId)
        .where('id', '!=', creator.id)
        .execute();

      for (const otherUser of otherUsers) {
        const notification = createPolicyAssignmentNotification(
          otherUser.id,
          creator.organizationId,
          policy.id,
          policy.title
        );
        await createNotification(notification);
      }
    }
  } catch (error) {
    // Log notification errors but don't fail the main operation
    console.error('Error sending policy creation notifications:', {
      policyId: policy.id,
      creatorId: creator.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};