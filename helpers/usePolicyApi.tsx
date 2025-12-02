import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  getListPolicies,
  InputType as ListPoliciesInput,
  FilterMetadata,
} from "../endpoints/policies/list_GET.schema";
import {
  postCreatePolicy,
  InputType as CreatePolicyInput,
} from "../endpoints/policies/create_POST.schema";
import {
  postUpdatePolicy,
  InputType as UpdatePolicyInput,
} from "../endpoints/policies/update_POST.schema";
import {
  postDeletePolicy,
  InputType as DeletePolicyInput,
} from "../endpoints/policies/delete_POST.schema";
import { toast } from "sonner";
import {
  postParseDocument,
  InputType as ParseDocumentInput,
} from "../endpoints/policies/parse-document_POST.schema";
import {
  postBulkCreatePolicies,
  InputType as BulkCreatePoliciesInput,
} from "../endpoints/policies/bulk-create_POST.schema";

import { POLICIES_QUERY_KEY } from "./policyQueryKeys";

// Import hooks from other policy-related helpers using namespace imports
import * as PolicyReading from "./usePolicyReading";
import * as PolicyDetails from "./usePolicyDetailsApi";
import { useOrganization } from "./useOrganization";

export const REVIEW_POLICIES_QUERY_KEY = "reviewPolicies";

// Internal helper hook that follows Rules of Hooks
const useOrgContext = () => {
  const { organizationState } = useOrganization();
  
  return {
    organizationId: organizationState.type === 'active' ? organizationState.currentOrganization.id : null,
    isOrgLoaded: organizationState.type !== 'loading',
  };
};

export const usePolicies = (filters: ListPoliciesInput) => {
  const { organizationId, isOrgLoaded } = useOrgContext();
  
  return useQuery({
    queryKey: [...POLICIES_QUERY_KEY, "list", { organizationId, ...filters }],
    queryFn: () => getListPolicies(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - policy lists are frequently updated
    enabled: filters.publicOnly ? true : isOrgLoaded,
  });
};

export const usePolicyFilterMetadata = (publicOnly: boolean = false) => {
  const { organizationId, isOrgLoaded } = useOrgContext();
  
  return useQuery({
    queryKey: [...POLICIES_QUERY_KEY, "filterMetadata", { organizationId, publicOnly }],
    queryFn: () => getListPolicies({ getFilterMetadata: true, limit: 1, publicOnly }),
    select: (data) => data.filterMetadata,
    staleTime: 10 * 60 * 1000, // 10 minutes - filter metadata doesn't change often
    enabled: publicOnly ? true : isOrgLoaded,
  });
};

export const useAllPolicies = (filters: Omit<ListPoliciesInput, 'limit' | 'page'> = {}) => {
  const { organizationId, isOrgLoaded } = useOrgContext();
  
  return useQuery({
    queryKey: [...POLICIES_QUERY_KEY, "listAll", { organizationId, ...filters }],
    queryFn: async () => {
      const allPolicies = [];
      let page = 1;
      const limit = 100; // Max allowed by the endpoint
      let hasMore = true;

      while (hasMore) {
        const response = await getListPolicies({ ...filters, page, limit });
        allPolicies.push(...response.policies);
        
        // If we got fewer policies than the limit, we've reached the end
        hasMore = response.policies.length === limit;
        page++;
      }

      // Return the same structure as usePolicies but with all policies
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
    staleTime: 2 * 60 * 1000, // 2 minutes - policy lists are frequently updated
    enabled: filters.publicOnly ? true : isOrgLoaded,
  });
};

export const useCreatePolicy = () => {
  const queryClient = useQueryClient();
  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;
  
  return useMutation({
    mutationFn: (newPolicy: CreatePolicyInput) => postCreatePolicy(newPolicy),
    onSuccess: () => {
      toast.success("Policy created successfully!");
      // Invalidate all policy-related queries for this organization
      queryClient.invalidateQueries({ queryKey: [...POLICIES_QUERY_KEY, "list"] });
      queryClient.invalidateQueries({ queryKey: [...POLICIES_QUERY_KEY, "filterMetadata"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats", { organizationId }] });
      // Invalidate review-related queries since new policies may have review dates
      queryClient.invalidateQueries({ queryKey: [...REVIEW_POLICIES_QUERY_KEY, "list"] });
      queryClient.invalidateQueries({ queryKey: [...REVIEW_POLICIES_QUERY_KEY, "stats"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create policy: ${error.message}`);
    },
  });
};

export const useUpdatePolicy = () => {
  const queryClient = useQueryClient();
  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;
  
  return useMutation({
    mutationFn: (policyData: UpdatePolicyInput) => postUpdatePolicy(policyData),
    onSuccess: (updatedPolicy, variables) => {
      // Check for portal URLs in the response
      if (updatedPolicy.portalUrls && updatedPolicy.portalUrls.length > 0) {
        // Show enhanced success message with portal links
        const portalLinks = updatedPolicy.portalUrls.map((url, index) => (
          <a 
            key={index} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              color: 'hsl(217 91% 60%)', 
              textDecoration: 'underline',
              marginLeft: index > 0 ? '0.5rem' : '0'
            }}
          >
            Portal {index + 1}
          </a>
        ));
        
        if (updatedPolicy.portalUrls.length === 1) {
          toast.success(
            <div>
              Policy updated and published successfully!<br />
              <span style={{ marginTop: '0.25rem', display: 'inline-block' }}>
                View on: {portalLinks[0]}
              </span>
            </div>
          );
        } else {
          toast.success(
            <div>
              Policy updated and published successfully!<br />
              <span style={{ marginTop: '0.25rem', display: 'inline-block' }}>
                View on: {portalLinks.reduce((acc, link, index) => [
                  ...acc,
                  ...(index > 0 ? [' • '] : []),
                  link
                ], [] as React.ReactNode[])}
              </span>
            </div>
          );
        }
      } else {
        // Fallback to simple success message
        toast.success("Policy updated successfully!");
      }
      
      // Invalidate policy list queries for this organization
      queryClient.invalidateQueries({ queryKey: [...POLICIES_QUERY_KEY, "list"] });
      queryClient.invalidateQueries({ queryKey: [...POLICIES_QUERY_KEY, "filterMetadata"] });
      // Also invalidate the specific policy details query if a policyId was provided
      if (variables.policyId) {
        queryClient.invalidateQueries({ queryKey: [...POLICIES_QUERY_KEY, 'details', variables.policyId] });
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats", { organizationId }] });
      // Invalidate review-related queries since policy updates can affect review dates
      queryClient.invalidateQueries({ queryKey: [...REVIEW_POLICIES_QUERY_KEY, "list"] });
      queryClient.invalidateQueries({ queryKey: [...REVIEW_POLICIES_QUERY_KEY, "stats"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update policy: ${error.message}`);
    },
  });
};

export const useDeletePolicy = () => {
  const queryClient = useQueryClient();
  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;
  
  return useMutation({
    mutationFn: (policyData: DeletePolicyInput) => postDeletePolicy(policyData),
    onSuccess: () => {
      toast.success("Policy deleted successfully!");
      // Invalidate policy list queries and filter metadata
      queryClient.invalidateQueries({ queryKey: [...POLICIES_QUERY_KEY, "list"] });
      queryClient.invalidateQueries({ queryKey: [...POLICIES_QUERY_KEY, "filterMetadata"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats", { organizationId }] });
      // Invalidate review-related queries since deleted policies affect review counts
      queryClient.invalidateQueries({ queryKey: [...REVIEW_POLICIES_QUERY_KEY, "list"] });
      queryClient.invalidateQueries({ queryKey: [...REVIEW_POLICIES_QUERY_KEY, "stats"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete policy: ${error.message}`);
    },
  });
};

export const useParseDocument = () => {
  return useMutation({
    mutationFn: (formData: FormData) => postParseDocument(formData),
    onError: (error: Error) => {
      toast.error(`Failed to parse document: ${error.message}`);
    },
  });
};

export const useBulkCreatePolicies = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;
  
  return useMutation({
    mutationFn: (policies: BulkCreatePoliciesInput) => postBulkCreatePolicies(policies),
    onSuccess: async (result) => {
      const count = result.length;
      toast.success(`${count} ${count === 1 ? 'policy' : 'policies'} created successfully!`);
      
      // Await query invalidations and refetches to complete before navigating
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...POLICIES_QUERY_KEY, "list"] }),
        queryClient.refetchQueries({ queryKey: [...POLICIES_QUERY_KEY, "list"] }),
        queryClient.invalidateQueries({ queryKey: [...POLICIES_QUERY_KEY, "filterMetadata"] }),
        queryClient.refetchQueries({ queryKey: [...POLICIES_QUERY_KEY, "filterMetadata"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", "stats", { organizationId }] }),
        queryClient.refetchQueries({ queryKey: ["dashboard", "stats", { organizationId }] }),
        queryClient.invalidateQueries({ queryKey: [...REVIEW_POLICIES_QUERY_KEY, "list"] }),
        queryClient.refetchQueries({ queryKey: [...REVIEW_POLICIES_QUERY_KEY, "list"] }),
        queryClient.invalidateQueries({ queryKey: [...REVIEW_POLICIES_QUERY_KEY, "stats"] }),
        queryClient.refetchQueries({ queryKey: [...REVIEW_POLICIES_QUERY_KEY, "stats"] }),
      ]);
      
      // Navigate to policies page after queries are invalidated
      navigate('/policies');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create policies: ${error.message}`);
    },
  });
};

import {
  getReviewPolicies,
  InputType as ReviewPolicyFilters,
} from "../endpoints/review-policies_GET.schema";
import { getReviewStats } from "../endpoints/review-policies/stats_GET.schema";

// Review-specific hooks
export const useReviewPolicies = (filters: ReviewPolicyFilters) => {
  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;
  
  return useQuery({
    queryKey: [...REVIEW_POLICIES_QUERY_KEY, "list", { organizationId, ...filters }],
    queryFn: () => getReviewPolicies(filters),
    placeholderData: (previousData) => previousData,
    enabled: organizationState?.type !== 'loading',
  });
};

export const useReviewStats = () => {
  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;
  
  return useQuery({
    queryKey: [...REVIEW_POLICIES_QUERY_KEY, "stats", { organizationId }],
    queryFn: () => getReviewStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes - stats don't change that frequently
    enabled: organizationState?.type !== 'loading',
  });
};

export const useOverdueCount = () => {
  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;
  
  return useQuery({
    queryKey: [...REVIEW_POLICIES_QUERY_KEY, "stats", { organizationId }],
    queryFn: () => getReviewStats(),
    select: (data) => data.totalOverdue,
    staleTime: 2 * 60 * 1000, // 2 minutes - count for navigation badge
    enabled: organizationState?.type !== 'loading',
  });
};

// Re-export all hooks for backward compatibility using export-star pattern
export * from "./usePolicyReading";
export * from "./usePolicyDetailsApi";