import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./delete_POST.schema";
import superjson from "superjson";
import { Transaction } from "kysely";
import { DB } from "../../helpers/schema";

async function deleteOrganizationData(organizationId: number, trx: Transaction<DB>) {
  console.log(`Starting deletion for organizationId: ${organizationId}`);

  // It's safer to delete from tables that have foreign keys to other tables first.
  // The order is crucial to avoid constraint violations.

  // Create subqueries for reuse
  const portalIdsSubquery = trx.selectFrom("portals").select("id").where("organizationId", "=", organizationId);
  const userIdsSubquery = trx.selectFrom("users").select("id").where("organizationId", "=", organizationId);
  const policyIdsSubquery = trx.selectFrom("policies").select("id").where("organizationId", "=", organizationId);

  // Level 3 dependencies (depend on policies, users, portals)
  await trx.deleteFrom("policyPortalAssignments").where("portalId", "in", portalIdsSubquery).execute();
  await trx.deleteFrom("policyKeyPointConfirmations").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("policyQuizAttempts").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("policyPrerequisites").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("portalLayoutOverrides").where("portalId", "in", portalIdsSubquery).execute();
  await trx.deleteFrom("portalSettings").where("portalId", "in", portalIdsSubquery).execute();
  
  // Level 2 dependencies (depend on users, policies)
  await trx.deleteFrom("sessions").where("userId", "in", userIdsSubquery).execute();
  await trx.deleteFrom("userPasswords").where("userId", "in", userIdsSubquery).execute();
  await trx.deleteFrom("oauthAccounts").where("userId", "in", userIdsSubquery).execute();
  await trx.deleteFrom("policyAcknowledgments").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("policyAssignments").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("policyReadingSessions").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("policyVersions").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("policyKeyPoints").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("policyQuizQuestions").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("policyAuditLog").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("policyDownloads").where("policyId", "in", policyIdsSubquery).execute();
  
  // Level 1 dependencies (depend on organization)
  await trx.deleteFrom("notifications").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("settings").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("organizationDownloadSettings").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("organizationVariables").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("portals").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("policies").where("organizationId", "=", organizationId).execute();
  await trx.deleteFrom("users").where("organizationId", "=", organizationId).execute();

  // Finally, delete the organization itself
  const result = await trx.deleteFrom("organizations").where("id", "=", organizationId).executeTakeFirst();

  if (result.numDeletedRows === 0n) {
    throw new Error("Organization not found or already deleted.");
  }
  console.log(`Successfully deleted organizationId: ${organizationId}`);
}

export async function handle(request: Request) {
  try {
    const { user: adminUser } = await getServerUserSession(request);

    if (adminUser.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: You must be an admin to perform this action." }),
        { status: 403 }
      );
    }

    const json = superjson.parse(await request.text());
    const { organizationId } = schema.parse(json);

    // Ensure the admin is deleting their own organization
    if (adminUser.organizationId !== organizationId) {
        return new Response(
            superjson.stringify({ error: "Forbidden: You can only delete your own organization." }),
            { status: 403 }
        );
    }



    await db.transaction().execute(async (trx) => {
      await deleteOrganizationData(organizationId, trx);
    });

    return new Response(
      superjson.stringify({ success: true, message: "Organization and all associated data have been permanently deleted." } satisfies OutputType)
    );
  } catch (error) {
    console.error("Failed to delete organization:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: errorMessage,
      }),
      { status: 500 }
    );
  }
}