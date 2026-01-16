import { db } from "./db";
import { User } from "./User";

const IMPERSONATION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours

/**
 * Check if user has super admin privileges
 */
export function isSuperAdmin(user: User | null | undefined): boolean {
  return user?.isSuperAdmin === true;
}

/**
 * Get active impersonation for a super admin
 */
export async function getActiveImpersonation(superAdminUserId: number) {
  return db
    .selectFrom("superAdminImpersonationLogs")
    .innerJoin(
      "organizations",
      "organizations.id",
      "superAdminImpersonationLogs.targetOrganizationId"
    )
    .leftJoin(
      "users as targetUser",
      "targetUser.id",
      "superAdminImpersonationLogs.targetUserId"
    )
    .select([
      "superAdminImpersonationLogs.id",
      "superAdminImpersonationLogs.targetOrganizationId",
      "superAdminImpersonationLogs.targetUserId",
      "organizations.name as organizationName",
      "targetUser.displayName as userDisplayName",
      "targetUser.email as userEmail",
      "targetUser.role as userRole",
      "superAdminImpersonationLogs.startedAt",
    ])
    .where("superAdminUserId", "=", superAdminUserId)
    .where("endedAt", "is", null)
    .executeTakeFirst();
}

/**
 * Check if impersonation has expired (8 hour limit)
 */
export function isImpersonationExpired(startedAt: Date): boolean {
  return Date.now() - startedAt.getTime() > IMPERSONATION_TIMEOUT_MS;
}

/**
 * Get effective organization ID for a user/session
 * Returns the impersonated org ID for super admins, or regular org ID for normal users
 */
export function getEffectiveOrganizationId(user: User): number | null {
  if (user.isSuperAdmin && user.impersonating) {
    return user.impersonating.organizationId;
  }
  return user.organizationId;
}

/**
 * Require organization context - throws if not available
 */
export function requireOrganizationId(user: User): number {
  const orgId = getEffectiveOrganizationId(user);

  if (orgId === null) {
    const message = user.isSuperAdmin
      ? "Please select a user to impersonate first"
      : "Organization context required";
    throw new Error(message);
  }

  return orgId;
}

/**
 * Start impersonation - ends any existing impersonation first
 */
export async function startImpersonation(
  superAdminUserId: number,
  targetOrganizationId: number,
  targetUserId: number,
  ipAddress: string | null,
  userAgent: string | null
): Promise<number> {
  // End any existing impersonation
  await endImpersonation(superAdminUserId, "manual");

  // Verify user exists and belongs to organization
  const targetUser = await db
    .selectFrom("users")
    .select(["id", "organizationId"])
    .where("id", "=", targetUserId)
    .executeTakeFirst();

  if (!targetUser || targetUser.organizationId !== targetOrganizationId) {
    throw new Error("User not found or does not belong to organization");
  }

  // Create new impersonation record
  const result = await db
    .insertInto("superAdminImpersonationLogs")
    .values({
      superAdminUserId,
      targetOrganizationId,
      targetUserId,
      ipAddress,
      userAgent,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  return result.id;
}

/**
 * End active impersonation
 */
export async function endImpersonation(
  superAdminUserId: number,
  reason: "manual" | "logout" | "expired" | "org_deleted" | "session_expired"
): Promise<void> {
  await db
    .updateTable("superAdminImpersonationLogs")
    .set({
      endedAt: new Date(),
      endReason: reason,
    })
    .where("superAdminUserId", "=", superAdminUserId)
    .where("endedAt", "is", null)
    .execute();
}
