import { getServerUserSession } from "../../helpers/getServerUserSession";
import { setServerSession, NotAuthenticatedError } from "../../helpers/getSetServerSession";

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

    const response = Response.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isSuperAdmin: true,
        organizationId: user.impersonating?.organizationId ?? null,
        role: "admin" as const,
        oauthProvider: null,
        hasLoggedIn: true,
        impersonating: user.impersonating,
      },
    });

    // Refresh session
    await setServerSession(response, {
      id: session.id,
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed.getTime(),
    });

    return response;
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    console.error("Super admin session error:", error);
    return Response.json(
      { error: { code: "ERROR", message: "Session check failed" } },
      { status: 500 }
    );
  }
}
