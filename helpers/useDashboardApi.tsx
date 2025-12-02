import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../endpoints/dashboard/stats_GET.schema";
import { useOrganization } from "./useOrganization";

export const DASHBOARD_STATS_QUERY_KEY = ["dashboard", "stats"];

export const useDashboardStats = () => {
  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;
  
  return useQuery({
    queryKey: [...DASHBOARD_STATS_QUERY_KEY, { organizationId }],
    queryFn: getDashboardStats,
    enabled: organizationState.type !== 'loading',
  });
};