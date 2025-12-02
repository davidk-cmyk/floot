import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./available-policies_GET.schema";
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
          error:
            "Forbidden: You must be an admin to view available policies.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);
    const input = schema.parse({
      portalId: url.searchParams.get("portalId"),
      search: url.searchParams.get("search"),
    });

    await checkPortalAccess(db, input.portalId, user.organizationId);

    let query = db
      .selectFrom("policies")
      .where("policies.organizationId", "=", user.organizationId)
      .where("policies.status", "=", "published")
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom("policyPortalAssignments")
              .where("policyPortalAssignments.portalId", "=", input.portalId)
              .whereRef(
                "policyPortalAssignments.policyId",
                "=",
                "policies.id"
              )
          )
        )
      );

    if (input.search) {
      query = query.where("policies.title", "ilike", `%${input.search}%`);
    }

    const policies = await query
      .selectAll()
      .orderBy("policies.title", "asc")
      .limit(50) // Limit results for performance in typeaheads
      .execute();

    const output: OutputType = {
      policies,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching available policies:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}