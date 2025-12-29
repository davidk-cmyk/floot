import { db } from "./db";

/**
 * Fetches portal assignment information for a given list of policy IDs.
 * This is used to enrich the policy list response with details about which
 * portals each policy is assigned to.
 *
 * @param policyIds - An array of policy IDs to fetch portal assignments for.
 * @returns A promise that resolves to a record mapping each policy ID to an
 *          array of its assigned portals (including portal ID, name, and
 *          acknowledgment requirement).
 */
export async function getPortalAssignments(policyIds: number[]): Promise<
  Record<
    number,
    Array<{ id: number; name: string; slug: string; requiresAcknowledgment: boolean }>
  >
> {
  if (policyIds.length === 0) {
    return {};
  }

  const assignments = await db
    .selectFrom("policyPortalAssignments")
    .innerJoin("portals", "portals.id", "policyPortalAssignments.portalId")
    .select([
      "policyPortalAssignments.policyId",
      "portals.id as portalId",
      "portals.name",
      "portals.slug",
      "portals.requiresAcknowledgment",
    ])
    .where("policyPortalAssignments.policyId", "in", policyIds)
    .execute();

  const portalsByPolicy: Record<
    number,
    Array<{ id: number; name: string; slug: string; requiresAcknowledgment: boolean }>
  > = {};

  for (const assignment of assignments) {
    if (!portalsByPolicy[assignment.policyId]) {
      portalsByPolicy[assignment.policyId] = [];
    }
    portalsByPolicy[assignment.policyId].push({
      id: assignment.portalId,
      name: assignment.name,
      slug: assignment.slug,
      requiresAcknowledgment: !!assignment.requiresAcknowledgment,
    });
  }

  return portalsByPolicy;
}