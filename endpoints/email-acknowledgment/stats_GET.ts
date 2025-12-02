import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { OutputType } from "./stats_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: You must be an admin." }),
        { status: 403 }
      );
    }

    const orgId = user.organizationId;

    // Get total acknowledged count
    const totalAcknowledgedResult = await db
      .selectFrom("emailBasedAcknowledgments")
      .select((eb) => eb.fn.countAll().as("count"))
      .where("organizationId", "=", orgId)
      .executeTakeFirstOrThrow();
    const totalAcknowledged = Number(totalAcknowledgedResult.count);

    // Get portal-level stats
    const portalStats = await db
      .selectFrom("portals")
      .select([
        "portals.id",
        "portals.name",
        (eb) =>
          eb
            .selectFrom("portalEmailRecipients")
            .select(eb.fn.countAll().as("emailCount"))
            .whereRef("portalEmailRecipients.portalId", "=", "portals.id")
            .as("emailCount"),
        (eb) =>
          eb
            .selectFrom("policyPortalAssignments")
            .select(eb.fn.countAll().as("policyCount"))
            .whereRef("policyPortalAssignments.portalId", "=", "portals.id")
            .as("policyCount"),
        (eb) =>
          eb
            .selectFrom("emailBasedAcknowledgments")
            .select(eb.fn.countAll().as("acknowledgedCount"))
            .whereRef("emailBasedAcknowledgments.portalId", "=", "portals.id")
            .as("acknowledgedCount"),
      ])
      .where("portals.organizationId", "=", orgId)
      .where(
        (eb) =>
          eb.exists(
            eb
              .selectFrom("portalEmailRecipients")
              .whereRef("portalEmailRecipients.portalId", "=", "portals.id")
          )
      )
      .groupBy(["portals.id", "portals.name"])
      .orderBy("portals.name")
      .execute();

    let totalExpected = 0;
    const breakdownByPortal = portalStats.map((p) => {
      const emailCount = Number(p.emailCount);
      const policyCount = Number(p.policyCount);
      const expectedCount = emailCount * policyCount;
      const acknowledgedCount = Number(p.acknowledgedCount);
      totalExpected += expectedCount;
      return {
        portalId: p.id,
        portalName: p.name,
        expectedCount,
        acknowledgedCount,
        completionRate: expectedCount > 0 ? (acknowledgedCount / expectedCount) * 100 : 0,
      };
    });

    const totalPortalsWithEmailTracking = breakdownByPortal.length;

    const output: OutputType = {
      totalPortalsWithEmailTracking,
      totalExpectedAcknowledgments: totalExpected,
      totalAcknowledged,
      acknowledgmentRate: totalExpected > 0 ? (totalAcknowledged / totalExpected) * 100 : 0,
      breakdownByPortal,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting email acknowledgment stats:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}