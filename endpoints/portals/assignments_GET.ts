import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./assignments_GET.schema";
import superjson from "superjson";
import { Kysely } from "kysely";
import { DB } from "../../helpers/schema";

async function checkPortalAccess(
  db: Kysely<DB>,
  portalId: number,
  organizationId: number
) {
  const portal = await db
    .selectFrom("portals")
    .select("id")
    .where("id", "=", portalId)
    .where("organizationId", "=", organizationId)
    .executeTakeFirst();

  if (!portal) {
    throw new Error("Portal not found or access denied.");
  }
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({
          error: "Forbidden: You must be an admin to view portal assignments.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);
    const input = schema.parse({
      portalId: url.searchParams.get("portalId"),
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
    });

    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const offset = (page - 1) * limit;

    await checkPortalAccess(db, input.portalId, user.organizationId);

    let baseQuery = db
      .selectFrom("policyPortalAssignments")
      .innerJoin("policies", "policies.id", "policyPortalAssignments.policyId")
      .where("policyPortalAssignments.portalId", "=", input.portalId)
      .where("policies.organizationId", "=", user.organizationId);

    const dataQuery = baseQuery
      .selectAll("policies")
      .select(["policyPortalAssignments.assignedAt"])
      .orderBy("policyPortalAssignments.assignedAt", "desc")
      .limit(limit)
      .offset(offset);

    const countQuery = baseQuery
      .select((eb) => eb.fn.countAll<string>().as("count"));

    const [assignments, totalResult] = await Promise.all([
      dataQuery.execute(),
      countQuery.executeTakeFirstOrThrow(),
    ]);

    const total = parseInt(totalResult.count, 10);

    const output: OutputType = {
      assignments,
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
    console.error("Error fetching portal assignments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}