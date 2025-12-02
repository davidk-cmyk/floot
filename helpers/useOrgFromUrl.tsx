import { useParams } from "react-router-dom";

export interface UseOrgFromUrlReturn {
  organizationId: number | null;
  hasOrgContext: boolean;
}

/**
 * Hook to extract organization ID from URL parameters.
 * 
 * Useful for components that need organization context from URL routes like:
 * - /:orgId/admin/dashboard
 * - /:orgId/employee-portal
 * - /:orgId/employee-portal/:policyId
 * 
 * Does not require authentication - simply reads from URL.
 * 
 * @returns Object containing organizationId (parsed to number or null) and hasOrgContext flag
 */
export const useOrgFromUrl = (): UseOrgFromUrlReturn => {
  const params = useParams<{ orgId?: string }>();
  
  let organizationId: number | null = null;
  let hasOrgContext = false;

  if (params.orgId) {
    const parsed = parseInt(params.orgId, 10);
    if (!isNaN(parsed) && parsed > 0) {
      organizationId = parsed;
      hasOrgContext = true;
    }
  }

  return {
    organizationId,
    hasOrgContext,
  };
};