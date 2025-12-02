import { useQuery } from "@tanstack/react-query";
import { getPublicPolicy } from "../endpoints/policies/public_GET.schema";

export const PUBLIC_POLICIES_QUERY_KEY = "public-policies";

/**
 * A React Query hook for fetching the details of a single public policy.
 *
 * This hook calls the `policies/public` GET endpoint and manages the query state,
 * including caching, loading, and error handling. It's designed for use on
 * public-facing pages where authentication is not required.
 *
 * @param policyId The ID of the policy to fetch. The query will be disabled if the ID is falsy.
 * @param options Optional query options, e.g., `enabled` to conditionally fire the query.
 * @returns The result of the React Query `useQuery` hook.
 */
export const usePublicPolicyDetails = (
  policyId: number,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [PUBLIC_POLICIES_QUERY_KEY, policyId],
    queryFn: () => getPublicPolicy({ policyId }),
    // The query is enabled by default if a valid policyId is provided,
    // but can be explicitly controlled via the `enabled` option.
    enabled: options?.enabled ?? !!policyId,
    placeholderData: (previousData) => previousData,
  });
};