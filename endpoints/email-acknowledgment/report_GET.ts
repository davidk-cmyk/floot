import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./report_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: You must be an admin." }),
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const input = schema.parse({
      portalId: url.searchParams.has("portalId")
        ? parseInt(url.searchParams.get("portalId")!, 10)
        : undefined,
      status: url.searchParams.get("status") || undefined,
      department: url.searchParams.get("department") || undefined,
      page: url.searchParams.has("page")
        ? parseInt(url.searchParams.get("page")!, 10)
        : 1,
      limit: url.searchParams.has("limit")
        ? parseInt(url.searchParams.get("limit")!, 10)
        : 25,
    });

    const page = input.page ?? 1;
    const limit = input.limit ?? 25;
    const offset = (page - 1) * limit;

    // Base query to generate all expected acknowledgments
    let baseQuery = db
      .selectFrom("portalEmailRecipients")
      .innerJoin("portals", "portals.id", "portalEmailRecipients.portalId")
      .innerJoin("policyPortalAssignments", "policyPortalAssignments.portalId", "portals.id")
      .innerJoin("policies", "policies.id", "policyPortalAssignments.policyId")
      .leftJoin("emailBasedAcknowledgments", (join) =>
        join
          .onRef("emailBasedAcknowledgments.portalId", "=", "portals.id")
          .onRef("emailBasedAcknowledgments.policyId", "=", "policies.id")
          .onRef("emailBasedAcknowledgments.email", "=", "portalEmailRecipients.email")
      )
      .where("portals.organizationId", "=", user.organizationId);

    // Apply filters
    if (input.portalId) {
      baseQuery = baseQuery.where("portals.id", "=", input.portalId);
    }
    if (input.department) {
      baseQuery = baseQuery.where("policies.department", "ilike", `%${input.department}%`);
    }
    if (input.status === "acknowledged") {
      baseQuery = baseQuery.where("emailBasedAcknowledgments.id", "is not", null);
    }
    if (input.status === "pending") {
      baseQuery = baseQuery.where("emailBasedAcknowledgments.id", "is", null);
    }

    // Data query with pagination
    const recordsQuery = baseQuery
      .select([
        "portalEmailRecipients.email",
        "policies.title as policyTitle",
        "policies.department",
        "portals.name as portalName",
        "emailBasedAcknowledgments.acknowledgedAt",
      ])
      .orderBy("portals.name")
      .orderBy("policies.title")
      .orderBy("portalEmailRecipients.email")
      .limit(limit)
      .offset(offset);

    // Count query for total
    const countQuery = baseQuery.select((eb) => eb.fn.countAll().as("count"));

    const [recordsResult, totalResult] = await Promise.all([
      recordsQuery.execute(),
      countQuery.executeTakeFirstOrThrow(),
    ]);

    const records = recordsResult.map((r) => ({
      email: r.email,
      policyTitle: r.policyTitle,
      department: r.department,
      portalName: r.portalName,
      status: (r.acknowledgedAt ? "acknowledged" : "pending") as "acknowledged" | "pending",
      acknowledgedAt: r.acknowledgedAt,
    }));

    const total = Number(totalResult.count);

    const output: OutputType = {
      records,
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
    console.error("Error generating email acknowledgment report:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}