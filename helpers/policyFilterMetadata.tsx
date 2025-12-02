import { db } from "./db";
import { User } from "./User";
import { FilterMetadata } from "../endpoints/policies/list_GET.schema";
import { sql } from "kysely";

/**
 * Fetches unique metadata values for populating filter dropdowns in the UI.
 * This includes distinct departments, categories, statuses, tags, and portals.
 * The queries respect the user's access level (public vs. organization-specific).
 *
 * @param user - The authenticated user object, or null for public access.
 * @param forcePublicOnly - A boolean to force queries to only consider public policies.
 * @returns A promise that resolves to an object containing arrays of unique filter values.
 */
export async function getFilterMetadata(
  user: User | null,
  forcePublicOnly: boolean
): Promise<FilterMetadata> {
  const getBaseQuery = () => {
    let query = db.selectFrom("policies");
    if (forcePublicOnly) {
      query = query.where(
        "policies.id",
        "in",
        (eb) =>
          eb
            .selectFrom("policyPortalAssignments")
            .innerJoin("portals", "portals.id", "policyPortalAssignments.portalId")
            .select("policyPortalAssignments.policyId")
            .where("portals.isActive", "=", true)
            .where("portals.accessType", "=", "public")
      );
    } else if (user) {
      query = query.where("policies.organizationId", "=", user.organizationId);
    } else {
      // Should not be reached if logic is correct, but as a safeguard:
      query = query.where(sql`1=0`);
    }
    return query;
  };

  const [
    departmentsResult,
    categoriesResult,
    statusesResult,
    tagsResult,
    portalsResult,
  ] = await Promise.all([
    // Departments
    getBaseQuery()
      .select("department")
      .where("department", "is not", null)
      .distinct()
      .execute(),
    // Categories
    getBaseQuery()
      .select("category")
      .where("category", "is not", null)
      .distinct()
      .execute(),
    // Statuses
    getBaseQuery().select("status").distinct().execute(),
    // Tags
    getBaseQuery()
      .select(sql<string>`unnest(tags)`.as("tag"))
      .distinct()
      .execute(),
    // Portals
    (() => {
      let portalQuery = db
        .selectFrom("portals")
        .select("name")
        .distinct()
        .where("isActive", "=", true);
      
      if (forcePublicOnly) {
        portalQuery = portalQuery.where("accessType", "=", "public");
      }
      
      if (!forcePublicOnly && !!user) {
        portalQuery = portalQuery.where("organizationId", "=", user.organizationId);
      }
      
      return portalQuery.execute();
    })(),
  ]);

  return {
    departments: departmentsResult.map((r: any) => r.department).filter(Boolean) as string[],
    categories: categoriesResult.map((r: any) => r.category).filter(Boolean) as string[],
    statuses: statusesResult.map((r: any) => r.status).filter(Boolean) as string[],
    tags: tagsResult.map((r: any) => r.tag).filter(Boolean) as string[],
    portals: portalsResult.map((r: any) => r.name).filter(Boolean) as string[],
  };
}