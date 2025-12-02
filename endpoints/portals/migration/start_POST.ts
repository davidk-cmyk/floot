import { db } from '../../../helpers/db';
import { getServerUserSession } from '../../../helpers/getServerUserSession';
import superjson from "superjson";
import { OutputType } from "./start_POST.schema";
import { Selectable } from "kysely";
import { Portals } from '../../../helpers/schema';

async function findOrCreatePortal(
trx: any, // Kysely's Transaction type is complex, using any for simplicity here
organizationId: number,
name: string,
slug: string,
accessType: "public" | "internal")
: Promise<{portal: Selectable<Portals>;created: boolean;}> {
  let portal = await trx.
  selectFrom("portals").
  selectAll().
  where("organizationId", "=", organizationId).
  where("slug", "=", slug).
  orderBy("id", "desc").
  executeTakeFirst();

  if (portal) {
    return { portal, created: false };
  }

  portal = await trx.
  insertInto("portals").
  values({
    organizationId,
    name,
    slug,
    accessType,
    isActive: true,
    description: `Default ${accessType} portal created during migration.`
  }).
  returningAll().
  executeTakeFirstOrThrow();

  return { portal, created: true };
}

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { organizationId } = user;

    const result = await db.transaction().execute(async (trx) => {
      // 1. Find or create default portals
      const { portal: publicPortal, created: publicPortalCreated } =
      await findOrCreatePortal(
        trx,
        organizationId,
        "Public Portal",
        "public",
        "public"
      );
      const { portal: internalPortal, created: internalPortalCreated } =
      await findOrCreatePortal(
        trx,
        organizationId,
        "Internal Portal",
        "internal",
        "internal"
      );

      // 2. Find unmigrated policies with their public status from policy_versions
      const unmigratedPolicies = await trx.
      selectFrom("policies").
      leftJoin("policyVersions", (join) => join
        .onRef("policies.id", "=", "policyVersions.policyId")
        .onRef("policies.currentVersion", "=", "policyVersions.versionNumber")
      ).
      select(["policies.id", "policyVersions.isPublic"]).
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

      if (unmigratedPolicies.length === 0) {
        return {
          migratedToPublic: 0,
          migratedToInternal: 0,
          publicPortalCreated,
          internalPortalCreated,
          message: "No policies needed migration."
        };
      }

      // 3. Prepare assignments
      const assignments = unmigratedPolicies.map((policy) => ({
        policyId: policy.id,
        portalId: policy.isPublic ? publicPortal.id : internalPortal.id,
        organizationId
      }));

      // 4. Insert assignments
      await trx.
      insertInto("policyPortalAssignments").
      values(assignments).
      execute();

      const migratedToPublic = assignments.filter(
        (a) => a.portalId === publicPortal.id
      ).length;
      const migratedToInternal = assignments.filter(
        (a) => a.portalId === internalPortal.id
      ).length;

      return {
        migratedToPublic,
        migratedToInternal,
        publicPortalCreated,
        internalPortalCreated,
        message: `Successfully migrated ${unmigratedPolicies.length} policies.`
      };
    });

    const response: OutputType = {
      success: true,
      ...result
    };

    return new Response(superjson.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error starting portal migration:", error);
    const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}