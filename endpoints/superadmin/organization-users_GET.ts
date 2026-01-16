import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { z } from "zod";

const querySchema = z.object({
  organizationId: z.coerce.number().int().positive(),
});

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

    const url = new URL(request.url);
    const parseResult = querySchema.safeParse({
      organizationId: url.searchParams.get("organizationId"),
    });

    if (!parseResult.success) {
      return Response.json(
        { error: { code: "INVALID_REQUEST", message: "Invalid organizationId parameter" } },
        { status: 400 }
      );
    }

    const { organizationId } = parseResult.data;

    // Verify organization exists
    const org = await db
      .selectFrom("organizations")
      .select(["id", "name"])
      .where("id", "=", organizationId)
      .executeTakeFirst();

    if (!org) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Organization not found" } },
        { status: 404 }
      );
    }

    // Get all users for the organization (excluding super admins)
    const users = await db
      .selectFrom("users")
      .select([
        "id",
        "email",
        "displayName",
        "firstName",
        "lastName",
        "role",
        "isActive",
        "hasLoggedIn",
        "createdAt",
        "updatedAt",
      ])
      .where("organizationId", "=", organizationId)
      .where("isSuperAdmin", "=", false)
      .orderBy("displayName", "asc")
      .execute();

    return Response.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive ?? true,
        hasLoggedIn: u.hasLoggedIn ?? false,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
        updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : null,
      })),
    });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    console.error("Get organization users error:", error);
    return Response.json(
      { error: { code: "ERROR", message: "Failed to get users" } },
      { status: 500 }
    );
  }
}
