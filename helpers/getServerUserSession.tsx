import { db } from "./db";
import { User } from "./User";

import {
  CleanupProbability,
  getServerSessionOrThrow,
  NotAuthenticatedError,
  SessionExpirationSeconds,
} from "./getSetServerSession";

export async function getServerUserSession(request: Request) {
  const session = await getServerSessionOrThrow(request);

  // Occasionally clean up expired sessions
  if (Math.random() < CleanupProbability) {
    const expirationDate = new Date(
      Date.now() - SessionExpirationSeconds * 1000
    );
    try {
      await db
        .deleteFrom("sessions")
        .where("lastAccessed", "<", expirationDate)
        .execute();
    } catch (cleanupError) {
      // Log but don't fail the request if cleanup fails
      console.error("Session cleanup error:", cleanupError);
    }
  }

  // Query the sessions and users tables in a single join query
  const results = await db
    .selectFrom("sessions")
    .innerJoin("users", "sessions.userId", "users.id")
    .leftJoin("oauthAccounts", "users.id", "oauthAccounts.userId")
    .select([
      "sessions.id as sessionId",
      "sessions.createdAt as sessionCreatedAt",
      "sessions.lastAccessed as sessionLastAccessed",
      "users.id",
      "users.email",
      "users.displayName",
      "users.role",
      "users.avatarUrl",
      "users.organizationId",
      "users.hasLoggedIn",
      "users.isSuperAdmin",
      "oauthAccounts.provider as oauthProvider",
    ])
    .where("sessions.id", "=", session.id)
    .limit(1)
    .execute();

  if (results.length === 0) {
    throw new NotAuthenticatedError();
  }

  const result = results[0];

  // Check for active impersonation if user is super admin
  let impersonating: User["impersonating"] | undefined;
  let effectiveRole = result.role;
  if (result.isSuperAdmin) {
    const activeImpersonation = await db
      .selectFrom("superAdminImpersonationLogs")
      .innerJoin("organizations", "organizations.id", "superAdminImpersonationLogs.targetOrganizationId")
      .leftJoin("users as targetUser", "targetUser.id", "superAdminImpersonationLogs.targetUserId")
      .select([
        "superAdminImpersonationLogs.targetOrganizationId",
        "superAdminImpersonationLogs.targetUserId",
        "organizations.name as organizationName",
        "targetUser.displayName as userDisplayName",
        "targetUser.email as userEmail",
        "targetUser.role as userRole",
        "superAdminImpersonationLogs.startedAt",
      ])
      .where("superAdminImpersonationLogs.superAdminUserId", "=", result.id)
      .where("superAdminImpersonationLogs.endedAt", "is", null)
      .executeTakeFirst();

    if (activeImpersonation) {
      // Check if impersonation has expired (8 hours)
      const IMPERSONATION_TIMEOUT_MS = 8 * 60 * 60 * 1000;
      const startedAt = new Date(activeImpersonation.startedAt);
      if (Date.now() - startedAt.getTime() > IMPERSONATION_TIMEOUT_MS) {
        // End expired impersonation
        await db
          .updateTable("superAdminImpersonationLogs")
          .set({ endedAt: new Date(), endReason: "expired" })
          .where("superAdminUserId", "=", result.id)
          .where("endedAt", "is", null)
          .execute();
      } else if (activeImpersonation.targetUserId && activeImpersonation.userDisplayName && activeImpersonation.userEmail && activeImpersonation.userRole) {
        // User-level impersonation with all required fields
        impersonating = {
          organizationId: activeImpersonation.targetOrganizationId,
          organizationName: activeImpersonation.organizationName,
          userId: activeImpersonation.targetUserId,
          userDisplayName: activeImpersonation.userDisplayName,
          userEmail: activeImpersonation.userEmail,
          userRole: activeImpersonation.userRole as User["role"],
          startedAt: startedAt.toISOString(),
        };
        // Use the impersonated user's role
        effectiveRole = activeImpersonation.userRole as User["role"];
      }
    }
  }

  const user = {
    id: result.id,
    email: result.email,
    displayName: result.displayName,
    avatarUrl: result.avatarUrl,
    role: effectiveRole,
    organizationId: result.organizationId,
    oauthProvider: result.oauthProvider,
    hasLoggedIn: result.hasLoggedIn || false,
    isSuperAdmin: result.isSuperAdmin || false,
    impersonating,
  };

  // Update the session's lastAccessed timestamp
  const now = new Date();
  await db
    .updateTable("sessions")
    .set({ lastAccessed: now })
    .where("id", "=", session.id)
    .execute();

  return {
    user: user satisfies User,
    // make sure to update the session in cookie
    session: {
      ...session,
      lastAccessed: now,
    },
  };
}
