import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { clearServerSession, NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { logSecurityEvent } from "../../helpers/securityAuditLogger";
import { endImpersonation } from "../../helpers/superAdmin";

export async function handle(request: Request) {
  try {
    const { user, session } = await getServerUserSession(request);

    // Verify user is super admin
    if (!user.isSuperAdmin) {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Super admin access required" } },
        { status: 403 }
      );
    }

    // End any active impersonation
    await endImpersonation(user.id, "logout");

    // Delete the session from database
    await db
      .deleteFrom("sessions")
      .where("id", "=", session.id)
      .execute();

    await logSecurityEvent({
      eventType: "superadmin_logout",
      userId: user.id,
      email: user.email,
      request,
    });

    const response = Response.json({ success: true });
    clearServerSession(response);
    return response;
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    console.error("Super admin logout error:", error);
    return Response.json(
      { error: { code: "ERROR", message: "Logout failed" } },
      { status: 500 }
    );
  }
}
