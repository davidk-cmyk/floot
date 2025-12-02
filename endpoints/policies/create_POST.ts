import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./create_POST.schema";
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
      throw new UnauthorizedPolicyActionError("Only admins or editors can create policies.");
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const { portalIds = [], ...policyInput } = input;

    const newPolicy = await withPolicyTransaction(async (trx) => {
      // Create the policy
      const policy = await trx
        .insertInto("policies")
        .values({
          ...policyInput,
          authorId: user.id,
          status: "draft", // Policies start as drafts
          currentVersion: 1, // Start with version 1
          organizationId: user.organizationId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Handle portal assignments if portalIds are provided
      if (portalIds && portalIds.length > 0) {
        // Verify that all portals exist, are active, and belong to the user's organization
        const portals = await trx
          .selectFrom("portals")
          .select("id")
          .where("organizationId", "=", user.organizationId)
          .where("id", "in", portalIds)
          .where("isActive", "=", true)
          .execute();

        if (portals.length !== portalIds.length) {
          throw new Error("One or more portals not found or inactive");
        }

        // Create assignment records
        const assignmentValues = portalIds.map(portalId => ({
          policyId: policy.id,
          portalId,
        }));

        // Insert into policyPortalAssignments table
        await trx
          .insertInto("policyPortalAssignments")
          .values(assignmentValues)
          .execute();
      }

      return policy;
    });

    // Handle taxonomy updates (non-blocking)
    if (input.department) {
      await updateDepartmentSetting(input.department, user.organizationId);
    }
    
    if (input.category) {
      await updateCategorySetting(input.category, user.organizationId);
    }

    // Log the policy creation
    await auditPolicyCreation(newPolicy, user, request);

    // Record policy version
    await recordPolicyVersion(newPolicy, user);

    // Send notifications based on user role
    await sendPolicyCreationNotifications(newPolicy, user);

    return new Response(superjson.stringify(newPolicy satisfies Selectable<Policies>), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    return handlePolicyError(error, { endpoint: 'policies/create' });
  }
}