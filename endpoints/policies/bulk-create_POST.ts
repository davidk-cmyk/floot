import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./bulk-create_POST.schema";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Policies } from "../../helpers/schema";
import { handlePolicyError, UnauthorizedPolicyActionError } from "../../helpers/policyErrorService";
import { updateDepartmentSetting, updateCategorySetting } from "../../helpers/policyTaxonomyService";
import { sendPolicyCreationNotifications } from "../../helpers/policyNotificationService";
import { auditPolicyCreation } from "../../helpers/policyAuditService";
import { recordPolicyVersion } from "../../helpers/policyVersionService";
import { withPolicyTransaction } from "../../helpers/policyTransactionService";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin" && user.role !== "editor") {
      throw new UnauthorizedPolicyActionError("Only admins or editors can bulk create policies.");
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const createdPolicies = await withPolicyTransaction(async (trx) => {
      const policiesToInsert = input.policies.map(p => ({
        ...p,
        authorId: user.id,
        status: "draft" as const,
        currentVersion: 1,
        organizationId: user.organizationId,
      }));

      const newPolicies = await trx
        .insertInto("policies")
        .values(policiesToInsert)
        .returningAll()
        .execute();

      if (newPolicies.length !== input.policies.length) {
        throw new Error("Failed to create all policies. Transaction rolled back.");
      }

      return newPolicies;
    });

    // Post-transaction operations (non-blocking)
    const uniqueDepartments = [...new Set(createdPolicies.map(p => p.department).filter(Boolean) as string[])];
    const uniqueCategories = [...new Set(createdPolicies.map(p => p.category).filter(Boolean) as string[])];

    // These are designed to be non-blocking and can run concurrently
    await Promise.all([
      ...uniqueDepartments.map(dep => updateDepartmentSetting(dep, user.organizationId)),
      ...uniqueCategories.map(cat => updateCategorySetting(cat, user.organizationId)),
    ]);

    // Audit, versioning, and notifications for each policy
    // These are also non-blocking and can run concurrently
    await Promise.all(createdPolicies.map(async (policy) => {
      await auditPolicyCreation(policy, user, request);
      await recordPolicyVersion(policy, user, "Initial version created from template.");
      await sendPolicyCreationNotifications(policy, user);
    }));

    return new Response(superjson.stringify(createdPolicies satisfies Selectable<Policies>[]), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    return handlePolicyError(error, { endpoint: 'policies/bulk-create' });
  }
}