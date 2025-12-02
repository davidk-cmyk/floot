import { useQuery } from "@tanstack/react-query";
import { postGetPolicy } from "../endpoints/policies/get_POST.schema";
import { POLICIES_QUERY_KEY } from "./policyQueryKeys";

export const usePolicyDetails = (
  policyId: number,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [...POLICIES_QUERY_KEY, "details", policyId],
    queryFn: () => postGetPolicy({ policyId }),
    enabled: options?.enabled ?? true,
    placeholderData: (previousData) => previousData,
  });
};