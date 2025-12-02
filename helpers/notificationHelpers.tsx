import { db } from "./db";
import { Insertable } from "kysely";
import { Notifications } from "./schema";

// Defines the structure for creating a new notification, excluding generated fields.
export type NotificationCreator = Omit<
  Insertable<Notifications>,
  "id" | "createdAt" | "isRead" | "readAt"
>;

/**
 * Creates a new notification in the database.
 * @param notification - The notification data to be inserted.
 * @returns The newly created notification object.
 */
export async function createNotification(
  notification: NotificationCreator
): Promise<Insertable<Notifications>> {
  try {
    const newNotification = await db
      .insertInto("notifications")
      .values(notification)
      .returningAll()
      .executeTakeFirstOrThrow();
    return newNotification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw new Error("Database operation failed during notification creation.");
  }
}

/**
 * Generates notification data for a new policy assignment.
 * @param userId - The ID of the user being notified.
 * @param organizationId - The ID of the organization.
 * @param policyId - The ID of the assigned policy.
 * @param policyTitle - The title of the assigned policy.
 * @returns A NotificationCreator object ready for insertion.
 */
export function createPolicyAssignmentNotification(
  userId: number,
  organizationId: number,
  policyId: number,
  policyTitle: string
): NotificationCreator {
  return {
    userId,
    organizationId,
    type: "policy_assignment",
    title: "New Policy Assigned",
    message: `You have been assigned a new policy: "${policyTitle}".`,
    relatedPolicyId: policyId,
  };
}

/**
 * Generates notification data for a policy acknowledgement reminder.
 * @param userId - The ID of the user being notified.
 * @param organizationId - The ID of the organization.
 * @param policyId - The ID of the policy requiring acknowledgement.
 * @param policyTitle - The title of the policy.
 * @param dueDate - The due date for acknowledgement.
 * @returns A NotificationCreator object ready for insertion.
 */
export function createAcknowledgementReminderNotification(
  userId: number,
  organizationId: number,
  policyId: number,
  policyTitle: string,
  dueDate: Date
): NotificationCreator {
  return {
    userId,
    organizationId,
    type: "acknowledgement_reminder",
    title: "Reminder: Policy Acknowledgement Due",
    message: `Please acknowledge the policy "${policyTitle}" by ${dueDate.toLocaleDateString()}.`,
    relatedPolicyId: policyId,
  };
}

/**
 * Generates notification data for when a policy is updated.
 * @param userId - The ID of the user being notified.
 * @param organizationId - The ID of the organization.
 * @param policyId - The ID of the updated policy.
 * @param policyTitle - The title of the updated policy.
 * @returns A NotificationCreator object ready for insertion.
 */
export function createPolicyUpdateNotification(
  userId: number,
  organizationId: number,
  policyId: number,
  policyTitle: string
): NotificationCreator {
  return {
    userId,
    organizationId,
    type: "policy_update",
    title: "Policy Updated",
    message: `The policy "${policyTitle}" has been updated. Please review the changes.`,
    relatedPolicyId: policyId,
  };
}