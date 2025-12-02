import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: You must be an admin to list portals." }),
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const input = schema.parse({
      search: url.searchParams.get("search") || undefined,
      accessType: url.searchParams.get("accessType") || undefined,
      isActive: url.searchParams.has("isActive")
        ? url.searchParams.get("isActive") === "true"
        : undefined,
      page: url.searchParams.has("page")
        ? parseInt(url.searchParams.get("page")!, 10)
        : 1,
      limit: url.searchParams.has("limit")
        ? parseInt(url.searchParams.get("limit")!, 10)
        : 10,
    });

    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const offset = (page - 1) * limit;

    // Build base query with joins and filters
    let baseQuery = db
      .selectFrom("portals")
      .leftJoin("policyPortalAssignments", "policyPortalAssignments.portalId", "portals.id")
      .leftJoin("policies", (join) => 
        join
          .onRef("policies.id", "=", "policyPortalAssignments.policyId")
          .on("policies.organizationId", "=", user.organizationId)
      )
      .where("portals.organizationId", "=", user.organizationId);

    if (input.search) {
      baseQuery = baseQuery.where("portals.name", "ilike", `%${input.search}%`);
    }
    if (input.accessType) {
      baseQuery = baseQuery.where("portals.accessType", "=", input.accessType);
    }
    if (typeof input.isActive === "boolean") {
      baseQuery = baseQuery.where("portals.isActive", "=", input.isActive);
    }

    // Create data query with GROUP BY and aggregation
    const dataQuery = baseQuery
      .select([
        "portals.id",
        "portals.name", 
        "portals.slug",
        "portals.description",
        "portals.accessType",
        "portals.allowedRoles",
        "portals.passwordHash",
        "portals.isActive",
        "portals.requiresAcknowledgment",
        "portals.acknowledgmentDueDays",
        "portals.acknowledgmentReminderDays",
        "portals.acknowledgmentMode",
        "portals.minimumReadingTimeSeconds",
        "portals.requireFullScroll",
        "portals.organizationId",
        "portals.createdAt",
        "portals.updatedAt"
      ])
      .select((eb) => [
        eb.fn.count("policies.id").as("assignedPolicyCount"),
        eb.fn.count(
          eb.case()
            .when("policies.status", "=", "published")
            .then("policies.id")
            .else(null)
            .end()
        ).as("publishedPolicyCount")
      ])
      .groupBy("portals.id")
      .limit(limit)
      .offset(offset)
      .orderBy("portals.createdAt", "desc");

    // Create count query for total without GROUP BY
    const countQuery = db
      .selectFrom("portals")
      .where("portals.organizationId", "=", user.organizationId);

    // Apply same filters to count query
    let finalCountQuery = countQuery;
    if (input.search) {
      finalCountQuery = finalCountQuery.where("portals.name", "ilike", `%${input.search}%`);
    }
    if (input.accessType) {
      finalCountQuery = finalCountQuery.where("portals.accessType", "=", input.accessType);
    }
    if (typeof input.isActive === "boolean") {
      finalCountQuery = finalCountQuery.where("portals.isActive", "=", input.isActive);
    }

    const finalCountQueryWithSelect = finalCountQuery.select((eb) => eb.fn.countAll().as("count"));

    const [portalsWithCounts, totalResult] = await Promise.all([
      dataQuery.execute(),
      finalCountQueryWithSelect.executeTakeFirstOrThrow(),
    ]);

    const total = parseInt(totalResult.count as string, 10);

    // Fetch email recipients for all portals
    const portalIds = portalsWithCounts.map((p: any) => p.id);
    const emailRecipients = portalIds.length > 0
      ? await db
          .selectFrom("portalEmailRecipients")
          .select(["portalId", "email"])
          .where("portalId", "in", portalIds)
          .where("organizationId", "=", user.organizationId)
          .execute()
      : [];

    // Group email recipients by portal ID
    const emailsByPortalId = emailRecipients.reduce((acc, record) => {
      if (!acc[record.portalId]) {
        acc[record.portalId] = [];
      }
      acc[record.portalId].push(record.email);
      return acc;
    }, {} as Record<number, string[]>);

    // Transform the results to include policy counts as numbers and email recipients
    const portals = portalsWithCounts.map((portal: any) => ({
      ...portal,
      assignedPolicyCount: parseInt(portal.assignedPolicyCount as string, 10),
      publishedPolicyCount: parseInt(portal.publishedPolicyCount as string, 10),
      policyCount: parseInt(portal.publishedPolicyCount as string, 10), // Backward compatibility
      emailRecipients: emailsByPortalId[portal.id] || []
    }));

    const output: OutputType = {
      portals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error listing portals:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}