import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./assignments_POST.schema";
import superjson from "superjson";
import { Kysely, Transaction } from "kysely";
import { DB } from "../../helpers/schema";

async function checkPortalAccess(
  db: Kysely<DB> | Transaction<DB>,
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
          error: "Forbidden: You must be an admin to modify portal assignments.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const { portalId, assignments } = input;

    // Handle empty assignments array - return early with success
    if (assignments.length === 0) {
      const output: OutputType = {
        success: true,
        message: "No changes to apply.",
        addedCount: 0,
        removedCount: 0,
      };

      return new Response(superjson.stringify(output), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const toAdd = assignments
      .filter((a) => a.action === "add")
      .map((a) => a.policyId);
    const toRemove = assignments
      .filter((a) => a.action === "remove")
      .map((a) => a.policyId);

    let addedCount = 0;
    let removedCount = 0;

    await db.transaction().execute(async (trx) => {
      await checkPortalAccess(trx, portalId, user.organizationId);

      if (toRemove.length > 0) {
        const result = await trx
          .deleteFrom("policyPortalAssignments")
          .where("portalId", "=", portalId)
          .where("policyId", "in", toRemove)
          .executeTakeFirst();
        removedCount = Number(result.numDeletedRows);
      }

      if (toAdd.length > 0) {
        // Verify policies exist and belong to the organization
        const policies = await trx
          .selectFrom("policies")
          .select("id")
          .where("organizationId", "=", user.organizationId)
          .where("id", "in", toAdd)
          .execute();

        if (policies.length !== toAdd.length) {
          throw new Error("One or more policies not found or access denied.");
        }

        const values = toAdd.map((policyId) => ({
          portalId,
          policyId,
        }));

        const result = await trx
          .insertInto("policyPortalAssignments")
          .values(values)
          .onConflict((oc) => oc.doNothing()) // Ignore if assignment already exists
          .execute();
        addedCount = result.length > 0 ? Number(result[0].numInsertedOrUpdatedRows) : 0;
      }
    });

    const output: OutputType = {
      success: true,
      message: `Successfully updated assignments: ${addedCount} added, ${removedCount} removed.`,
      addedCount,
      removedCount,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating portal assignments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}