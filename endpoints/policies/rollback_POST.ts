import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./rollback_POST.schema";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Policies } from "../../helpers/schema";

export async function handle(request: Request) {
  const { user } = await getServerUserSession(request);

  try {
    const json = superjson.parse(await request.text());
    const { policyId, versionNumber } = schema.parse(json);

    const updatedPolicy = await db.transaction().execute(async (trx) => {
      // 1. Fetch the policy and lock it to prevent concurrent modifications
      const policy = await trx
        .selectFrom("policies")
        .selectAll()
        .where("id", "=", policyId)
        .where("organizationId", "=", user.organizationId)
        .forUpdate()
        .executeTakeFirst();

      if (!policy) {
        throw new Error("Policy not found.");
      }

      // 2. Authorization check
      const canRollback =
        user.role === "admin" ||
        user.role === "editor" ||
        policy.authorId === user.id;

      if (!canRollback) {
        throw new Error(
          "Unauthorized: You do not have permission to roll back this policy."
        );
      }

      const targetVersion = await trx
        .selectFrom("policyVersions")
        .selectAll()
        .where("policyId", "=", policyId)
        .where("versionNumber", "=", versionNumber)
        .where("organizationId", "=", user.organizationId)
        .executeTakeFirst();

      if (!targetVersion) {
        throw new Error("Target version for rollback not found.");
      }

      // 3. Calculate the next version number from the locked policy's currentVersion
      // This is the single source of truth and prevents race conditions since the row is locked
      const newVersionNumber = (policy.currentVersion ?? 0) + 1;

      console.log(
        `Rolling back policy ${policyId} to version ${versionNumber}. Current version: ${policy.currentVersion}, new version will be: ${newVersionNumber}`
      );

      const updatedPolicyResult = await trx
        .updateTable("policies")
        .set({
          title: targetVersion.title,
          content: targetVersion.content,
          status: targetVersion.status,
          effectiveDate: targetVersion.effectiveDate,
          expirationDate: targetVersion.expirationDate,
          tags: targetVersion.tags,
          department: targetVersion.department,
          category: targetVersion.category,
          requiresAcknowledgment: targetVersion.requiresAcknowledgment,
          currentVersion: newVersionNumber,
          updatedAt: new Date(),
        })
        .where("id", "=", policyId)
        .returningAll()
        .executeTakeFirstOrThrow();

      // 4. Update the auto-created policy version entry with custom changeSummary
      // Note: The database trigger (policy_version_on_update) automatically creates
      // a policy_versions record when the policies table is updated.
      // We just need to update it with our custom changeSummary.
      console.log(
        `Updating changeSummary for auto-created version ${newVersionNumber} for policy ${policyId}`
      );

      await trx
        .updateTable("policyVersions")
        .set({
          changeSummary: `Rolled back to version ${versionNumber}.`,
        })
        .where("policyId", "=", policyId)
        .where("versionNumber", "=", newVersionNumber)
        .execute();

      return updatedPolicyResult;
    });

    return new Response(
      superjson.stringify(updatedPolicy satisfies Selectable<Policies>),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error rolling back policy:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    const statusCode = errorMessage.startsWith("Unauthorized") ? 403 : 400;
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: statusCode,
    });
  }
}