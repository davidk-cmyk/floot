import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGetPolicyVersions,
  InputType as GetVersionsInput,
} from "../endpoints/policies/versions_GET.schema";
import {
  getGetPolicyVersion,
  InputType as GetVersionInput,
} from "../endpoints/policies/version_GET.schema";
import {
  getComparePolicyVersions,
  InputType as CompareVersionsInput,
} from "../endpoints/policies/compare_GET.schema";
import {
  postRollbackPolicy,
  InputType as RollbackInput,
} from "../endpoints/policies/rollback_POST.schema";
import { toast } from "sonner";

export const POLICY_VERSIONS_QUERY_KEY = "policyVersions";
export const POLICY_VERSION_QUERY_KEY = "policyVersion";

// Hook to get all versions of a policy
export const usePolicyVersions = (params: GetVersionsInput) => {
  return useQuery({
    queryKey: [POLICY_VERSIONS_QUERY_KEY, params.policyId],
    queryFn: () => getGetPolicyVersions(params),
    enabled: !!params.policyId,
  });
};

// Hook to get a single specific version of a policy
export const usePolicyVersion = (params: GetVersionInput) => {
  return useQuery({
    queryKey: [
      POLICY_VERSION_QUERY_KEY,
      params.policyId,
      params.versionNumber,
    ],
    queryFn: () => getGetPolicyVersion(params),
    enabled: !!params.policyId && !!params.versionNumber,
  });
};

// Hook to compare two versions of a policy
export const useComparePolicyVersions = (params: CompareVersionsInput) => {
  return useQuery({
    queryKey: [
      POLICY_VERSIONS_QUERY_KEY,
      "compare",
      params.policyId,
      params.version1,
      params.version2,
    ],
    queryFn: () => getComparePolicyVersions(params),
    enabled: !!params.policyId && !!params.version1 && !!params.version2,
  });
};

// Hook to rollback a policy to a previous version
export const useRollbackPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RollbackInput) => postRollbackPolicy(data),
    onSuccess: (data, variables) => {
      toast.success(
        `Policy successfully rolled back to version ${variables.versionNumber}.`
      );
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({
        queryKey: [POLICY_VERSIONS_QUERY_KEY, variables.policyId],
      });
      // You might also want to invalidate the main policy list or detail view
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
    onError: (error) => {
      toast.error(`Rollback failed: ${error.message}`);
    },
  });
};