import { z } from "zod";
import superjson from "superjson";
import {
  CategoryDistribution,
  DepartmentCoverage,
  TagUsage,
} from "../../helpers/policyAnalytics";

// No input schema needed for this GET request
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

// Type for an individual item in the category distribution, with percentage
export type CategoryDistributionItem = {
  name: string;
  count: number;
  percentage: number;
};

// Type for organization-specific metrics
export type OrganizationMetric = {
  id: number;
  name: string;
  policyCount: number;
};

// The full output type for the analytics overview endpoint
export type OutputType = {
  categoryDistribution: CategoryDistributionItem[];
  departmentCoverage: DepartmentCoverage;
  tagUsage: TagUsage;
  organizationMetrics: OrganizationMetric[];
};

/**
 * Fetches cross-organization policy overview analytics.
 * This endpoint is restricted to admin users.
 * @param body - Empty object for GET request.
 * @param init - Optional request initialization options.
 * @returns A promise that resolves to the analytics data.
 */
export const getPolicyOverview = async (
  body: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/analytics/policy-overview`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text()) as { error?: string };
    throw new Error(errorObject.error || "Failed to fetch analytics data");
  }

  return superjson.parse<OutputType>(await result.text());
};