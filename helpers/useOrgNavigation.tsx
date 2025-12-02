import { useNavigate } from "react-router-dom";
import { useOrgFromUrl } from "./useOrgFromUrl";

export interface UseOrgNavigationReturn {
  orgId: number | null;
  buildUrl: (path: string) => string;
  navigateToAdmin: (path: string) => void;
  navigateToPortal: (portalSlug: string, policyId?: string) => void;
  navigate: (path: string) => void;
}

/**
 * Hook to simplify navigation within organization-scoped routes.
 * 
 * Ensures all navigation preserves the organization context by automatically
 * prefixing paths with the current organization ID from the URL.
 * 
 * Usage:
 * ```tsx
 * const { buildUrl, navigateToAdmin, navigateToPortal } = useOrgNavigation();
 * 
 * // Build URLs for Link components
 * <Link to={buildUrl('/dashboard')}>Dashboard</Link>
 * 
 * // Navigate to admin routes
 * navigateToAdmin('/policies/create');
 * 
 * // Navigate to portal pages
 * navigateToPortal('employee-portal');
 * navigateToPortal('employee-portal', '123');
 * ```
 * 
 * @returns Object containing orgId, buildUrl, navigateToAdmin, navigateToPortal, and navigate functions
 */
export const useOrgNavigation = (): UseOrgNavigationReturn => {
  const { organizationId } = useOrgFromUrl();
  const routerNavigate = useNavigate();

  /**
   * Build an organization-scoped URL by prefixing the path with /{orgId}
   * 
   * @param path - The path to prefix (e.g., '/dashboard', '/policies/create')
   * @returns The organization-scoped URL (e.g., '/123/dashboard')
   */
  const buildUrl = (path: string): string => {
    if (!organizationId) {
      console.warn("useOrgNavigation: organizationId is null, cannot build URL");
      return path;
    }
    // Remove leading slash from path if present to avoid double slashes
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/${organizationId}${cleanPath}`;
  };

  /**
   * Navigate to an admin route with organization context
   * 
   * @param path - The admin path (e.g., '/policies/create')
   */
  const navigateToAdmin = (path: string): void => {
    const adminPath = path.startsWith("/admin") ? path : `/admin${path}`;
    routerNavigate(buildUrl(adminPath));
  };

  /**
   * Navigate to a portal route with organization context
   * 
   * @param portalSlug - The portal slug (e.g., 'employee-portal')
   * @param policyId - Optional policy ID for portal policy detail pages
   */
  const navigateToPortal = (portalSlug: string, policyId?: string): void => {
    if (policyId) {
      routerNavigate(buildUrl(`/${portalSlug}/${policyId}`));
    } else {
      routerNavigate(buildUrl(`/${portalSlug}`));
    }
  };

  /**
   * Generic navigate function that applies organization context
   * 
   * @param path - The path to navigate to
   */
  const navigate = (path: string): void => {
    routerNavigate(buildUrl(path));
  };

  return {
    orgId: organizationId,
    buildUrl,
    navigateToAdmin,
    navigateToPortal,
    navigate,
  };
};