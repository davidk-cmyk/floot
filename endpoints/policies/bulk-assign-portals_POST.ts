import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./bulk-assign-portals_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin" && user.role !== "editor") {
      return new Response(
        superjson.stringify({
          error: "Forbidden: You must be an admin or editor to assign policies to portals.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const { policyIds, portalIds } = input;

    let totalAssigned = 0;

    await db.transaction().execute(async (trx) => {
      const portals = await trx
        .selectFrom("portals")
        .select("id")
        .where("organizationId", "=", user.organizationId)
        .where("id", "in", portalIds)
        .execute();

      if (portals.length !== portalIds.length) {
        throw new Error("One or more portals not found or access denied.");
      }

      const policies = await trx
        .selectFrom("policies")
        .select("id")
        .where("organizationId", "=", user.organizationId)
        .where("id", "in", policyIds)
        .execute();

      if (policies.length !== policyIds.length) {
        throw new Error("One or more policies not found or access denied.");
      }

      const assignments: { portalId: number; policyId: number }[] = [];
      for (const portalId of portalIds) {
        for (const policyId of policyIds) {
          assignments.push({ portalId, policyId });
        }
      }

      if (assignments.length > 0) {
        const result = await trx
          .insertInto("policyPortalAssignments")
          .values(assignments)
          .onConflict((oc) => oc.doNothing())
          .execute();
        
        totalAssigned = result.reduce((sum, r) => sum + Number(r.numInsertedOrUpdatedRows || 0), 0);
      }
    });

    const output: OutputType = {
      success: true,
      message: `Successfully assigned ${policyIds.length} ${policyIds.length === 1 ? "policy" : "policies"} to ${portalIds.length} ${portalIds.length === 1 ? "portal" : "portals"}.`,
      assignedCount: totalAssigned,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error bulk assigning policies to portals:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
