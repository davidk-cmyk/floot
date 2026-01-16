import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { endImpersonation, getActiveImpersonation } from "../../helpers/superAdmin";
import { logSecurityEvent } from "../../helpers/securityAuditLogger";

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

    // Get current impersonation for logging
    const impersonation = await getActiveImpersonation(user.id);

    if (!impersonation) {
      return Response.json(
        { error: { code: "NOT_IMPERSONATING", message: "No active impersonation" } },
        { status: 400 }
      );
    }

    // End impersonation
    await endImpersonation(user.id, "manual");

    const duration = Date.now() - new Date(impersonation.startedAt).getTime();

    await logSecurityEvent({
      eventType: "superadmin_impersonation_end",
      userId: user.id,
      email: user.email,
      request,
      details: {
        targetOrganizationId: impersonation.targetOrganizationId,
        organizationName: impersonation.organizationName,
        duration,
        reason: "manual",
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
        organizationId: null,
        role: "admin" as const,
        oauthProvider: null,
        hasLoggedIn: true,
      },
    });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    console.error("Stop impersonate error:", error);
    return Response.json(
      { error: { code: "ERROR", message: "Failed to stop impersonation" } },
      { status: 500 }
    );
  }
}
