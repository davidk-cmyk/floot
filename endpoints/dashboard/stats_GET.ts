import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { OutputType } from "./stats_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Unauthorized: Only admins can view dashboard stats." }),
        { status: 403 }
      );
    }

    const [
      totalPoliciesResult,
      pendingApprovalResult,
      totalAcknowledgmentsResult,
      pendingRemindersResult,
      overdueAssignmentsResult,
      unacknowledgedRequiredResult,
      requiresAcknowledgementResult,
    ] = await Promise.all([
      db.selectFrom("policies").where("organizationId", "=", user.organizationId).select(db.fn.countAll<string>().as("count")).executeTakeFirstOrThrow(),
      db.selectFrom("policies").where("organizationId", "=", user.organizationId).where("status", "=", "pending_approval").select(db.fn.countAll<string>().as("count")).executeTakeFirstOrThrow(),
      db.selectFrom("policyAcknowledgments").where("organizationId", "=", user.organizationId).select(db.fn.countAll<string>().as("count")).executeTakeFirstOrThrow(),
      db.selectFrom("unacknowledgedRequiredPolicies").where("organizationId", "=", user.organizationId).where("urgencyStatus", "in", ["overdue", "due_soon"]).select(db.fn.countAll<string>().as("count")).executeTakeFirstOrThrow(),
      db.selectFrom("unacknowledgedRequiredPolicies").where("organizationId", "=", user.organizationId).where("urgencyStatus", "=", "overdue").select(db.fn.countAll<string>().as("count")).executeTakeFirstOrThrow(),
      db.selectFrom("unacknowledgedRequiredPolicies").where("organizationId", "=", user.organizationId).select(db.fn.countAll<string>().as("count")).executeTakeFirstOrThrow(),
      db.selectFrom("policies")
        .innerJoin("policyPortalAssignments", "policies.id", "policyPortalAssignments.policyId")
        .innerJoin("portalEmailRecipients", "policyPortalAssignments.portalId", "portalEmailRecipients.portalId")
        .where("policies.organizationId", "=", user.organizationId)
        .where("policies.status", "=", "published")
        .select((eb) => eb.fn.count<string>("policies.id").distinct().as("count"))
        .executeTakeFirstOrThrow(),
    ]);

    const totalPolicies = parseInt(totalPoliciesResult.count, 10);
    const totalAcknowledgments = parseInt(totalAcknowledgmentsResult.count, 10);
    const unacknowledgedRequired = parseInt(unacknowledgedRequiredResult.count, 10);
    
    // Calculate acknowledgment rate based on portal requirements
    // Total expected = actual acknowledgments + unacknowledged required
    // Rate = actual / expected
    const totalExpectedAcks = totalAcknowledgments + unacknowledgedRequired;
    const acknowledgmentRate = totalExpectedAcks > 0 ? (totalAcknowledgments / totalExpectedAcks) * 100 : 0;

    const output: OutputType = {
      totalPolicies,
      pendingApprovals: parseInt(pendingApprovalResult.count, 10),
      acknowledgmentRate: parseFloat(acknowledgmentRate.toFixed(2)),
      pendingReminders: parseInt(pendingRemindersResult.count, 10),
      overdueAssignments: parseInt(overdueAssignmentsResult.count, 10),
      requiresAcknowledgement: parseInt(requiresAcknowledgementResult.count, 10),
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}