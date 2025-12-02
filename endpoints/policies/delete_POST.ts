import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema } from "./delete_POST.schema";
import superjson from "superjson";
import { logPolicyAction } from "../../helpers/policyAuditLogger";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { policyId } = schema.parse(json);

    const policy = await db
      .selectFrom("policies")
      .selectAll()
      .where("id", "=", policyId)
      .executeTakeFirst();

    if (!policy) {
      return new Response(
        superjson.stringify({ error: "Policy not found." }),
        { status: 404 }
      );
    }

    const canDelete = user.role === "admin" || policy.authorId === user.id;

    if (!canDelete) {
      return new Response(
        superjson.stringify({ error: "Unauthorized: You do not have permission to delete this policy." }),
        { status: 403 }
      );
    }

    // Log the policy deletion with final state before deletion
    await logPolicyAction({
      policyId: policy.id,
      policyName: policy.title,
      organizationId: user.organizationId,
      action: "delete",
      actionBy: user.id,
      details: {
        finalState: {
          title: policy.title,
          status: policy.status,
          department: policy.department,
          category: policy.category,
          currentVersion: policy.currentVersion,
          requiresAcknowledgment: policy.requiresAcknowledgment,
        },
      },
      request,
    });

    // First, delete related acknowledgments to maintain referential integrity
    await db
      .deleteFrom("policyAcknowledgments")
      .where("policyId", "=", policyId)
      .execute();

    // Then, delete the policy
    const deleteResult = await db
      .deleteFrom("policies")
      .where("id", "=", policyId)
      .executeTakeFirst();

    if (deleteResult.numDeletedRows === 0n) {
        // This case should be rare given the check above, but it's good practice
        return new Response(
            superjson.stringify({ error: "Policy not found or already deleted." }),
            { status: 404 }
        );
    }

    return new Response(
      superjson.stringify({ success: true, message: "Policy deleted successfully." }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting policy:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}