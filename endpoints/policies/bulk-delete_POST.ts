import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./bulk-delete_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    // Only admins can bulk delete policies
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({
          error: "Forbidden: You must be an admin to delete policies.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const { policyIds } = input;

    class NotFoundError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "NotFoundError";
      }
    }

    let deletedCount = 0;

    await db.transaction().execute(async (trx) => {
      // Verify all policies exist and belong to the user's organization
      const policies = await trx
        .selectFrom("policies")
        .select(["id", "title"])
        .where("organizationId", "=", user.organizationId)
        .where("id", "in", policyIds)
        .execute();

      if (policies.length !== policyIds.length) {
        throw new NotFoundError("One or more policies not found or access denied.");
      }

      // Delete related records first (foreign key constraints)
      // Delete policy portal assignments
      await trx
        .deleteFrom("policyPortalAssignments")
        .where("policyId", "in", policyIds)
        .execute();

      // Delete policy acknowledgments
      await trx
        .deleteFrom("policyAcknowledgments")
        .where("policyId", "in", policyIds)
        .execute();

      // Delete policy versions
      await trx
        .deleteFrom("policyVersions")
        .where("policyId", "in", policyIds)
        .execute();

      // Delete the policies
      const result = await trx
        .deleteFrom("policies")
        .where("id", "in", policyIds)
        .where("organizationId", "=", user.organizationId)
        .execute();

      deletedCount = Number(result[0]?.numDeletedRows || 0);
    });

    const output: OutputType = {
      success: true,
      message: `Successfully deleted ${deletedCount} ${deletedCount === 1 ? "policy" : "policies"}.`,
      deletedCount,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error bulk deleting policies:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    const status = error instanceof Error && error.name === "NotFoundError" ? 404 : 400;
    return new Response(superjson.stringify({ error: errorMessage }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
