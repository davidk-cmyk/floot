import { db } from "./db";
import {
  STANDARD_POLICY_CATEGORIES,
  STANDARD_DEPARTMENTS,
  STANDARD_POLICY_TAGS,
} from "./globalPolicyTaxonomiesBackend";
import { sql } from "kysely";

// --- Type Definitions for Analytics Results ---

/**
 * Represents the count of policies for a specific taxonomy item (e.g., category, department, tag).
 */
export type TaxonomyCount = {
  name: string;
  count: number;
};

/**
 * Represents the distribution of policies across standard categories.
 */
export type CategoryDistribution = TaxonomyCount[];

/**
 * Represents the number of policies associated with each standard department.
 */
export type DepartmentCoverage = TaxonomyCount[];

/**
 * Represents the usage frequency of standard policy tags.
 */
export type TagUsage = TaxonomyCount[];

// --- Analytics Query Functions ---

/**
 * Generates an analytics-friendly query to get policy distribution by standard categories
 * across all organizations. This demonstrates using a consistent taxonomy for reporting.
 *
 * @returns A promise that resolves to an array of objects, each containing a category name and its policy count.
 */
export async function getPolicyDistributionByCategory(): Promise<CategoryDistribution> {
  console.log("Fetching policy distribution by standard category.");
  try {
    const result = await db
      .selectFrom("policies")
      .select((eb) => [
        "category",
        eb.fn.count("id").as("policyCount"),
      ])
      .where("category", "is not", null)
      .where("category", "in", [...STANDARD_POLICY_CATEGORIES])
      .groupBy("category")
      .orderBy("policyCount", "desc")
      .execute();

    // Kysely with CamelCasePlugin returns camelCase keys, but count is an aggregate.
    // The raw result from pg driver might be snake_case. Let's handle both.
    return result.map((row) => ({
      name: row.category!,
      count: Number((row as any).policyCount || (row as any).policy_count || 0),
    }));
  } catch (error) {
    console.error("Error fetching policy distribution by category:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get policy distribution: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching policy distribution.");
  }
}

/**
 * Generates an analytics-friendly query for department coverage analysis across all organizations.
 * It counts how many policies are assigned to each standard department.
 *
 * @returns A promise that resolves to an array of objects, each containing a department name and its policy count.
 */
export async function getDepartmentCoverageAnalysis(): Promise<DepartmentCoverage> {
  console.log("Fetching department coverage analysis.");
  try {
    const result = await db
      .selectFrom("policies")
      .select((eb) => [
        "department",
        eb.fn.count("id").as("policyCount"),
      ])
      .where("department", "is not", null)
      .where("department", "in", [...STANDARD_DEPARTMENTS])
      .groupBy("department")
      .orderBy("policyCount", "desc")
      .execute();

    return result.map((row) => ({
      name: row.department!,
      count: Number((row as any).policyCount || (row as any).policy_count || 0),
    }));
  } catch (error) {
    console.error("Error fetching department coverage analysis:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get department coverage: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching department coverage.");
  }
}

/**
 * Generates an analytics-friendly query to analyze tag usage patterns using only standard tags.
 * This function unnests the tags array in the database for efficient counting.
 *
 * @returns A promise that resolves to an array of objects, each containing a tag name and its usage count.
 */
export async function getTagUsagePatterns(): Promise<TagUsage> {
  console.log("Fetching tag usage patterns for standard tags.");
  try {
    // We use a raw SQL query here because unnesting array columns is a DB-specific feature
    // that is most cleanly handled this way in Kysely.
    const { rows } = await sql<{ tag: string; tag_count: string }>`
      SELECT
        tag,
        COUNT(*) as tag_count
      FROM (
        SELECT unnest(tags) as tag
        FROM policies
        WHERE tags IS NOT NULL AND cardinality(tags) > 0
      ) as unnested_tags
      WHERE tag = ANY(${sql.val(STANDARD_POLICY_TAGS)})
      GROUP BY tag
      ORDER BY tag_count DESC;
    `.execute(db);

    return rows.map(row => ({
      name: row.tag,
      count: Number(row.tag_count),
    }));
  } catch (error) {
    console.error("Error fetching tag usage patterns:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get tag usage patterns: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching tag usage patterns.");
  }
}

// --- Example Aggregation Functions for Reporting ---

/**
 * An example aggregation function that calculates the percentage distribution for a given
 * set of taxonomy counts. Useful for creating charts.
 *
 * @param data The array of taxonomy counts (e.g., from getPolicyDistributionByCategory).
 * @returns The same array with an added `percentage` property for each item.
 */
export function calculatePercentageDistribution<T extends TaxonomyCount>(data: T[]) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return data.map(item => ({ ...item, percentage: 0 }));
  }

  return data.map(item => ({
    ...item,
    percentage: parseFloat(((item.count / total) * 100).toFixed(2)),
  }));
}