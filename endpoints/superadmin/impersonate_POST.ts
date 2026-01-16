import { db } from "../../helpers/db";
import { schema } from "./impersonate_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { startImpersonation } from "../../helpers/superAdmin";
import { logSecurityEvent } from "../../helpers/securityAuditLogger";

function getIpAddress(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

function getUserAgent(request: Request): string | null {
  return request.headers.get("user-agent");
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    // Verify user is super admin
    if (!user.isSuperAdmin) {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Super admin access required" } },
        { status: 403 }
      );
    }

    const json = await request.json();
    const { userId } = schema.parse(json);

    // Get target user with organization info
    const targetUser = await db
      .selectFrom("users")
      .innerJoin("organizations", "organizations.id", "users.organizationId")
      .select([
        "users.id",
        "users.email",
        "users.displayName",
        "users.role",
        "users.organizationId",
        "users.isActive",
        "users.isSuperAdmin",
        "organizations.name as organizationName",
      ])
      .where("users.id", "=", userId)
      .executeTakeFirst();

    if (!targetUser) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    if (!targetUser.organizationId) {
      return Response.json(
        { error: { code: "INVALID_USER", message: "User has no organization" } },
        { status: 400 }
      );
    }

    // Prevent impersonating other super admins
    if (targetUser.isSuperAdmin) {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Cannot impersonate another super admin" } },
        { status: 403 }
      );
    }

    // Prevent impersonating inactive users
    if (targetUser.isActive === false) {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Cannot impersonate inactive user" } },
        { status: 403 }
      );
    }

    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);

    // Start impersonation with user ID (ends any existing one)
    await startImpersonation(
      user.id,
      targetUser.organizationId,
      userId,
      ipAddress,
      userAgent
    );

    await logSecurityEvent({
      eventType: "superadmin_impersonation_start",
      userId: user.id,
      email: user.email,
      request,
      details: {
        targetUserId: userId,
        targetUserEmail: targetUser.email,
        targetUserRole: targetUser.role,
        targetOrganizationId: targetUser.organizationId,
        organizationName: targetUser.organizationName,
      },
    });

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isSuperAdmin: true,
        organizationId: targetUser.organizationId,
        role: targetUser.role,
        oauthProvider: null,
        hasLoggedIn: true,
        impersonating: {
          organizationId: targetUser.organizationId,
          organizationName: targetUser.organizationName,
          userId: targetUser.id,
          userDisplayName: targetUser.displayName,
          userEmail: targetUser.email,
          userRole: targetUser.role,
          startedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    console.error("Impersonate error:", error);
    return Response.json(
      { error: { code: "ERROR", message: "Failed to start impersonation" } },
      { status: 500 }
    );
  }
}
