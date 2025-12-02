import { db } from '../../../helpers/db';
import { getServerUserSession } from '../../../helpers/getServerUserSession';
import superjson from "superjson";
import { OutputType } from "./status_GET.schema";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const { organizationId } = user;

    // Total policies for the organization
    const totalPoliciesResult = await db.
    selectFrom("policies").
    select(db.fn.count("id").as("count")).
    where("organizationId", "=", organizationId).
    executeTakeFirstOrThrow();

    const totalPolicies = Number(totalPoliciesResult.count);

    // Policies already assigned to at least one portal
    const migratedPoliciesResult = await db.
    selectFrom("policyPortalAssignments").
    innerJoin("portals", "policyPortalAssignments.portalId", "portals.id").
    select(db.fn.count("policyPortalAssignments.policyId").distinct().as("count")).
    where("portals.organizationId", "=", organizationId).
    executeTakeFirstOrThrow();

    const migratedPoliciesCount = Number(migratedPoliciesResult.count);

    // Policies not yet assigned to any portal (unmigrated)
    const unmigratedPolicies = await db.
    selectFrom("policies").
    select(["policies.id"]).
    where("policies.organizationId", "=", organizationId).
    where(
      "policies.id",
      "not in",
      (eb) =>
      eb.
      selectFrom("policyPortalAssignments").
      innerJoin("portals", "policyPortalAssignments.portalId", "portals.id").
      select("policyPortalAssignments.policyId").
      where("portals.organizationId", "=", organizationId)
    ).
    execute();

    // For migration status, we'll assume all unmigrated policies need to be categorized
    // This is a simplified approach since the old isPublic flag is being phased out
    const unmigratedPublicCount = 0; // Will be determined during migration
    const unmigratedInternalCount = unmigratedPolicies.length;

    const response: OutputType = {
      totalPolicies,
      migratedPolicies: migratedPoliciesCount,
      unmigratedPolicies: unmigratedPolicies.length,
      unmigratedPublic: unmigratedPublicCount,
      unmigratedInternal: unmigratedInternalCount
    };

    return new Response(superjson.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error getting portal migration status:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      superjson.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}