import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { OutputType } from "./pending_GET.schema";
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

    const pendingAcknowledgments = await db
      .selectFrom("portalEmailRecipients")
      .innerJoin("portals", "portals.id", "portalEmailRecipients.portalId")
      .innerJoin("policyPortalAssignments", "policyPortalAssignments.portalId", "portals.id")
      .innerJoin("policies", "policies.id", "policyPortalAssignments.policyId")
      .where("portals.organizationId", "=", user.organizationId)
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom("emailBasedAcknowledgments")
              .whereRef("emailBasedAcknowledgments.portalId", "=", "portals.id")
              .whereRef("emailBasedAcknowledgments.policyId", "=", "policies.id")
              .whereRef("emailBasedAcknowledgments.email", "=", "portalEmailRecipients.email")
          )
        )
      )
      .select([
        "portalEmailRecipients.email",
        "policies.title as policyTitle",
        "policies.id as policyId",
        "portals.name as portalName",
        "portals.id as portalId",
        "portals.organizationId",
      ])
      .orderBy("portals.name")
      .orderBy("policies.title")
      .orderBy("portalEmailRecipients.email")
      .execute();

    const output: OutputType = pendingAcknowledgments;

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching pending email acknowledgments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}