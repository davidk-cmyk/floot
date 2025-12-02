import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getListPortals,
  InputType as ListPortalsInput,
} from "../endpoints/portals/list_GET.schema";
import {
  postCreatePortal,
  InputType as CreatePortalInput,
} from "../endpoints/portals/create_POST.schema";
import {
  postUpdatePortal,
  InputType as UpdatePortalInput,
} from "../endpoints/portals/update_POST.schema";
import {
  postDeletePortal,
  InputType as DeletePortalInput,
} from "../endpoints/portals/delete_POST.schema";
import {
  getPortalPolicies,
  InputType as PortalPoliciesInput,
} from "../endpoints/portalPolicies_GET.schema";
import {
  getPortalPolicyDetails,
  InputType as PortalPolicyDetailsInput,
} from "../endpoints/portalPolicy_GET.schema";
import { useAuth } from "./useAuth";

export const PORTALS_QUERY_KEY = "portals";
export const PORTAL_POLICIES_QUERY_KEY = "portal-policies";
export const PORTAL_POLICY_DETAILS_QUERY_KEY = "portal-policy-details";

/**
 * Hook to fetch a list of portals for the current organization.
 * Only enabled for authenticated admin users.
 * @param filters - Pagination, search, and filter parameters.
 */
export const usePortals = (filters: ListPortalsInput) => {
  const { authState } = useAuth();
  
  return useQuery({
    queryKey: [PORTALS_QUERY_KEY, "list", filters],
    queryFn: () => getListPortals(filters),
    placeholderData: (previousData) => previousData,
    enabled: authState.type === 'authenticated' && authState.user.role === 'admin',
  });
};

/**
 * Hook to create a new portal.
 * Invalidates the portal list query on success.
 */
export const useCreatePortal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newPortal: CreatePortalInput) => postCreatePortal(newPortal),
    onSuccess: () => {
      toast.success("Portal created successfully!");
      queryClient.invalidateQueries({ queryKey: [PORTALS_QUERY_KEY, "list"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to create portal: ${errorMessage}`);
      console.error("Create portal error:", error);
    },
  });
};

/**
 * Hook to update an existing portal.
 * Invalidates the portal list query on success.
 */
export const useUpdatePortal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (portalData: UpdatePortalInput) => postUpdatePortal(portalData),
    onSuccess: () => {
      toast.success("Portal updated successfully!");
      queryClient.invalidateQueries({ queryKey: [PORTALS_QUERY_KEY, "list"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to update portal: ${errorMessage}`);
      console.error("Update portal error:", error);
    },
  });
};

/**
 * Hook to delete a portal.
 * Invalidates the portal list query on success.
 */
export const useDeletePortal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (portalData: DeletePortalInput) => postDeletePortal(portalData),
    onSuccess: () => {
      toast.success("Portal deleted successfully!");
      queryClient.invalidateQueries({ queryKey: [PORTALS_QUERY_KEY, "list"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to delete portal: ${errorMessage}`);
      console.error("Delete portal error:", error);
    },
  });
};

/**
 * Hook to fetch policies for a specific portal.
 * Supports pagination, filtering, and access control.
 * @param portalSlug - The unique slug identifier for the portal
 * @param filters - Search, pagination, and filter parameters
 */
export const usePortalPolicies = (portalSlug: string, filters: Omit<PortalPoliciesInput, 'portalSlug'>) => {
  return useQuery({
    queryKey: [PORTAL_POLICIES_QUERY_KEY, portalSlug, filters],
    queryFn: () => getPortalPolicies({ portalSlug, ...filters }),
    placeholderData: (previousData) => previousData,
    enabled: !!portalSlug,
  });
};

/**
 * Hook to fetch detailed information for a specific policy within a portal.
 * Returns both portal info and policy details with author information.
 * @param portalSlug - The unique slug identifier for the portal
 * @param policyId - The ID of the policy to fetch
 * @param password - Optional password for password-protected portals
 */
export const usePortalPolicyDetails = (
  portalSlug: string, 
  policyId: number, 
  password?: string
) => {
  const queryKey = [PORTAL_POLICY_DETAILS_QUERY_KEY, portalSlug, policyId, { password }];
  
  console.log('[usePortalPolicyDetails] Query created with key:', queryKey);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('[usePortalPolicyDetails] Fetching data for:', { portalSlug, policyId, hasPassword: !!password });
      const result = await getPortalPolicyDetails({ portalSlug, policyId, password });
      console.log('[usePortalPolicyDetails] Data fetched successfully:', {
        policyId: result.policy.id,
        policyTitle: result.policy.title,
        portalName: result.portal.name,
        userAcknowledgmentStatus: result.userAcknowledgmentStatus,
      });
      return result;
    },
    placeholderData: (previousData) => previousData,
    enabled: !!(portalSlug && policyId),
  });
};