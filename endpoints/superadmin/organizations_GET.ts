import { db } from "../../helpers/db";
import { sql } from "kysely";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

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

    // Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "25", 10))
    );
    const search = url.searchParams.get("search") || "";
    const sortBy = (url.searchParams.get("sortBy") || "name") as
      | "name"
      | "createdAt"
      | "userCount";
    const sortOrder = (url.searchParams.get("sortOrder") || "asc") as
      | "asc"
      | "desc";

    const offset = (page - 1) * pageSize;

    // Build base query for organizations with user count
    let query = db
      .selectFrom("organizations")
      .leftJoin("users", (join) =>
        join
          .onRef("users.organizationId", "=", "organizations.id")
          .on("users.isSuperAdmin", "=", false)
      )
      .select([
        "organizations.id",
        "organizations.name",
        "organizations.slug",
        "organizations.createdAt",
        sql<number>`COUNT(DISTINCT users.id)`.as("userCount"),
      ])
      .groupBy("organizations.id");

    // Apply search filter
    if (search) {
      query = query.where(
        sql`LOWER(organizations.name)`,
        "like",
        `%${search.toLowerCase()}%`
      );
    }

    // Get total count for pagination
    let countQuery = db
      .selectFrom("organizations")
      .select(sql<number>`COUNT(*)`.as("total"));

    if (search) {
      countQuery = countQuery.where(
        sql`LOWER(organizations.name)`,
        "like",
        `%${search.toLowerCase()}%`
      );
    }

    const countResult = await countQuery.executeTakeFirst();
    const total = Number(countResult?.total || 0);

    // Apply sorting
    if (sortBy === "userCount") {
      query = query.orderBy(sql`COUNT(DISTINCT users.id)`, sortOrder);
    } else if (sortBy === "createdAt") {
      query = query.orderBy("organizations.createdAt", sortOrder);
    } else {
      query = query.orderBy("organizations.name", sortOrder);
    }

    // Apply pagination
    const organizations = await query.limit(pageSize).offset(offset).execute();

    // Get admin emails for each organization
    const orgIds = organizations.map((o) => o.id);
    const adminEmails =
      orgIds.length > 0
        ? await db
            .selectFrom("users")
            .select(["organizationId", "email"])
            .where("organizationId", "in", orgIds)
            .where("role", "=", "admin")
            .where("isSuperAdmin", "=", false)
            .execute()
        : [];

    const adminEmailMap = new Map<number, string>();
    for (const admin of adminEmails) {
      if (admin.organizationId && !adminEmailMap.has(admin.organizationId)) {
        adminEmailMap.set(admin.organizationId, admin.email);
      }
    }

    return Response.json({
      organizations: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt ? new Date(org.createdAt).toISOString() : null,
        userCount: Number(org.userCount),
        adminEmail: adminEmailMap.get(org.id) || null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    console.error("List organizations error:", error);
    return Response.json(
      { error: { code: "ERROR", message: "Failed to list organizations" } },
      { status: 500 }
    );
  }
}
