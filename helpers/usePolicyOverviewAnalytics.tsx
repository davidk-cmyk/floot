import { useQuery } from "@tanstack/react-query";
import { getPolicyOverview } from "../endpoints/analytics/policy-overview_GET.schema";

export const POLICY_OVERVIEW_ANALYTICS_QUERY_KEY = ["analytics", "policyOverview"] as const;

/**
 * A React Query hook to fetch the cross-organization policy overview analytics.
 *
 * It handles fetching, caching, and error states for the analytics data.
 * This hook should only be used in components accessible to admin users,
 * as the underlying endpoint is permission-restricted.
 *
 * @returns The result of the useQuery hook, containing the analytics data,
 *          loading status, and any errors.
 */
export const usePolicyOverviewAnalytics = () => {
  return useQuery({
    queryKey: POLICY_OVERVIEW_ANALYTICS_QUERY_KEY,
    queryFn: () => getPolicyOverview(),
    // Analytics data can be slightly stale, no need to refetch aggressively.
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};