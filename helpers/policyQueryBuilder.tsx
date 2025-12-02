import { db } from "./db";
import { User } from "./User";
import { InputType } from "../endpoints/policies/list_GET.schema";
import { ExpressionBuilder, sql } from "kysely";
import { DB } from "./schema";

/**
 * Builds the base Kysely query for fetching policies, including filtering,
 * searching, and calculating acknowledgment statistics.
 * This function uses Common Table Expressions (CTEs) for performance and clarity.
 *
 * @param user - The authenticated user object, or null for public access.
 * @param forcePublicOnly - A boolean to force the query to only return public policies,
 *                          regardless of user authentication status.
 * @param input - The parsed query parameters for filtering and searching.
 * @returns An object containing the final query and the base query (for counting).
 */
export function buildPolicyQuery(
  user: User | null,
  forcePublicOnly: boolean,
  input: InputType
) {
  const baseQuery = db.with("PolicyPortals", (db) =>
    db
      .selectFrom("policyPortalAssignments")
      .innerJoin("portals", "portals.id", "policyPortalAssignments.portalId")
      .select([
        "policyPortalAssignments.policyId",
        "portals.name as portalName",
        "portals.requiresAcknowledgment as portalRequiresAcknowledgment",
      ])
      .where("portals.isActive", "=", true)
      .where("portals.accessType", "=", "public")
  )
  .with("UserAssignments", (db) => {
    let query = db
      .selectFrom("policyAssignments")
      .select(["policyId", "userId"]);
    if (user) {
      query = query.where("userId", "=", user.id);
    } else {
      // No user, so this CTE will be empty
      query = query.where(sql`1 = 0`);
    }
    return query;
  })
  .with("AcknowledgmentStats", (db) => {
    let query = db
      .selectFrom("policyAssignments")
      .select((eb) => [
        "policyId",
        eb.fn.count("userId").filterWhere("userId", "is not", null).as("assignedCount"),
        eb.fn
          .count("userId")
          .filterWhere(
            "userId",
            "in",
            eb.selectFrom("policyAcknowledgments").select("userId").whereRef("policyAcknowledgments.policyId", "=", "policyAssignments.policyId")
          )
          .as("acknowledgedCount"),
        eb.fn
          .count("userId")
          .filterWhere("dueDate", "is not", null)
          .filterWhere("dueDate", "<", new Date())
          .filterWhere(
            "userId",
            "not in",
            eb.selectFrom("policyAcknowledgments").select("userId").whereRef("policyAcknowledgments.policyId", "=", "policyAssignments.policyId")
          )
          .as("overdueCount"),
        eb.fn
          .count("userId")
          .filterWhere("dueDate", "is not", null)
          .filterWhere("dueDate", ">=", new Date())
          .filterWhere("dueDate", "<=", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // Due in the next 7 days
          .filterWhere(
            "userId",
            "not in",
            eb.selectFrom("policyAcknowledgments").select("userId").whereRef("policyAcknowledgments.policyId", "=", "policyAssignments.policyId")
          )
          .as("dueSoonCount"),
      ])
      .groupBy("policyId");

    if (user) {
      query = query.where("organizationId", "=", user.organizationId);
    } else {
      // No user, so this CTE will be empty
      query = query.where(sql`1 = 0`);
    }
    return query;
  })
  .selectFrom("policies")
  .leftJoin("AcknowledgmentStats", "AcknowledgmentStats.policyId", "policies.id")
  .leftJoin("UserAssignments", "UserAssignments.policyId", "policies.id")
  .select((eb) => [
    "policies.id",
    "policies.title",
    "policies.status",
    "policies.department",
    "policies.category",
    "policies.tags",
    "policies.effectiveDate",
    "policies.createdAt",
    "policies.updatedAt",
    sql<boolean>`${sql.table("UserAssignments")}.${sql.id("userId")} IS NOT NULL`.as("acknowledged"),
    sql<boolean>`EXISTS (
      SELECT 1
      FROM "policy_portal_assignments" ppa
      JOIN "portals" p ON p.id = ppa."portal_id"
      WHERE ppa."policy_id" = "policies".id AND p."requires_acknowledgment" = true
    )`.as("requiresAcknowledgmentFromPortals"),
    "AcknowledgmentStats.acknowledgedCount",
    "AcknowledgmentStats.assignedCount",
    "AcknowledgmentStats.overdueCount",
    "AcknowledgmentStats.dueSoonCount",
  ]);

  let modifiableQuery = baseQuery;

  // Apply security context
  if (forcePublicOnly) {
    modifiableQuery = modifiableQuery.where(
      "policies.id",
      "in",
      (eb) => eb.selectFrom("PolicyPortals").select("policyId")
    );
  } else if (user) {
    modifiableQuery = modifiableQuery.where("policies.organizationId", "=", user.organizationId);
  } else {
    // Should not happen if forcePublicOnly is handled correctly, but as a safeguard:
    modifiableQuery = modifiableQuery.where(sql`1 = 0`);
  }

  // Apply filters
  if (input.search) {
    // Using raw SQL for tsvector capabilities
    const searchVector = sql`to_tsvector('english', policies.title || ' ' || policies.content)`;
    const searchQuery = sql`to_tsquery('english', ${input.search.split(' ').join(' & ')})`;
    modifiableQuery = modifiableQuery.where(searchVector, "@@", searchQuery);
  }
  if (input.status) {
    modifiableQuery = modifiableQuery.where("policies.status", "=", input.status);
  }
  if (input.department) {
    modifiableQuery = modifiableQuery.where("policies.department", "=", input.department);
  }
  if (input.category) {
    modifiableQuery = modifiableQuery.where("policies.category", "=", input.category);
  }
  if (input.tags && input.tags.length > 0) {
    modifiableQuery = modifiableQuery.where("policies.tags", "&&", sql`ARRAY[${sql.join(input.tags)}]::varchar[]`);
  }
  if (input.portal) {
    modifiableQuery = modifiableQuery.where(
      "policies.id",
      "in",
      (eb) =>
        eb
          .selectFrom("policyPortalAssignments")
          .innerJoin("portals", "portals.id", "policyPortalAssignments.portalId")
          .select("policyPortalAssignments.policyId")
          .where("portals.name", "=", input.portal as string)
    );
  }
  if (typeof input.requiresAcknowledgment === "boolean") {
    const subquery = (eb: ExpressionBuilder<DB, "policies">) =>
      eb
        .selectFrom("policyPortalAssignments")
        .innerJoin("portals", "portals.id", "policyPortalAssignments.portalId")
        .select("policyPortalAssignments.policyId")
        .where("portals.requiresAcknowledgment", "=", true);

    if (input.requiresAcknowledgment) {
      modifiableQuery = modifiableQuery.where("policies.id", "in", subquery);
    } else {
      modifiableQuery = modifiableQuery.where("policies.id", "not in", subquery);
    }
  }

  return modifiableQuery;
}