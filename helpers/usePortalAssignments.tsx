import { useQuery } from "@tanstack/react-query";
import { getPortalAssignments } from "../endpoints/portals/assignments_GET.schema";

export const PORTAL_ASSIGNMENTS_QUERY_KEY = 'portalAssignments';

export const useAllPortalAssignments = (portalId: number) => {
  return useQuery({
    queryKey: [PORTAL_ASSIGNMENTS_QUERY_KEY, 'all', portalId],
    queryFn: async () => {
      const allPolicies = [];
      let page = 1;
      const limit = 100; // Max allowed by the endpoint
      let hasMore = true;

      while (hasMore) {
        const response = await getPortalAssignments({ portalId, page, limit });
        allPolicies.push(...response.assignments);
        
        // If we got fewer assignments than the limit, we've reached the end
        hasMore = response.assignments.length === limit;
        page++;
      }

      // Return the same structure as the original but with all policies
      // Map assignments to policies for backward compatibility
      return {
        policies: allPolicies,
        pagination: {
          page: 1,
          limit: allPolicies.length,
          total: allPolicies.length,
          totalPages: 1,
        },
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - portal assignments don't change that frequently
  });
};