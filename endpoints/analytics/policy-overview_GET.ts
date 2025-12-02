import { OutputType } from "./policy-overview_GET.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";
import {
  getPolicyDistributionByCategory,
  getDepartmentCoverageAnalysis,
  getTagUsagePatterns,
  calculatePercentageDistribution,
} from "../../helpers/policyAnalytics";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    // This is a sensitive endpoint, restrict to admins only.
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching policy overview analytics for admin user:", user.id);

    // 1. Policy distribution by standard categories
    const categoryDistributionData = await getPolicyDistributionByCategory();
    const categoryDistribution = calculatePercentageDistribution(categoryDistributionData);

    // 2. Department coverage analysis
    const departmentCoverage = await getDepartmentCoverageAnalysis();

    // 3. Standard tag usage patterns
    const tagUsage = await getTagUsagePatterns();

    // 4. Organization comparison metrics
    const organizationMetrics = await db
      .selectFrom("organizations")
      .leftJoin("policies", "organizations.id", "policies.organizationId")
      .select((eb) => [
        "organizations.id",
        "organizations.name",
        eb.fn.count("policies.id").as("policyCount"),
      ])
      .groupBy(["organizations.id", "organizations.name"])
      .orderBy("policyCount", "desc")
      .execute();

    const formattedOrgMetrics = organizationMetrics.map(org => ({
      id: org.id,
      name: org.name,
      policyCount: Number((org as any).policyCount || 0),
    }));

    const response: OutputType = {
      categoryDistribution,
      departmentCoverage,
      tagUsage,
      organizationMetrics: formattedOrgMetrics,
    };

    return new Response(superjson.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching policy overview analytics:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    // Differentiate between auth errors and other server errors
    if (errorMessage.includes("Not authenticated")) {
        return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(
      superjson.stringify({ error: "Failed to fetch policy overview analytics" }),
      { status: 500 }
    );
  }
}