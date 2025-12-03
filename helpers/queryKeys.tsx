/**
 * Centralized Query Key Factory
 *
 * Provides consistent query key patterns for TanStack Query.
 * Using a factory pattern ensures:
 * - Type safety for query keys
 * - Consistent key structure
 * - Easy cache invalidation
 * - Autocomplete support
 */

// Helper type for query key arrays
type QueryKey = readonly unknown[];

/**
 * Query key factory for all application resources
 */
export const queryKeys = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // Organizations
  organizations: {
    all: ['organizations'] as const,
    list: () => [...queryKeys.organizations.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.organizations.all, 'detail', id] as const,
    bySlug: (slug: string) => [...queryKeys.organizations.all, 'slug', slug] as const,
    variables: (orgId: number) => [...queryKeys.organizations.all, orgId, 'variables'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.all, 'list', filters] as const,
    detail: (id: number) => [...queryKeys.users.all, 'detail', id] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
  },

  // Policies
  policies: {
    all: ['policies'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.policies.all, 'list', filters] as const,
    detail: (id: number | string) => [...queryKeys.policies.all, 'detail', id] as const,
    versions: (policyId: number) => [...queryKeys.policies.all, policyId, 'versions'] as const,
    audit: (policyId: number) => [...queryKeys.policies.all, policyId, 'audit'] as const,
    acknowledgments: (policyId: number) =>
      [...queryKeys.policies.all, policyId, 'acknowledgments'] as const,
    filterMetadata: (orgId?: number) =>
      [...queryKeys.policies.all, 'filterMetadata', orgId] as const,
    review: (filters?: Record<string, unknown>) =>
      [...queryKeys.policies.all, 'review', filters] as const,
    public: (portalSlug: string, policyId: number | string) =>
      [...queryKeys.policies.all, 'public', portalSlug, policyId] as const,
  },

  // Portals
  portals: {
    all: ['portals'] as const,
    list: (orgId?: number) => [...queryKeys.portals.all, 'list', orgId] as const,
    detail: (id: number) => [...queryKeys.portals.all, 'detail', id] as const,
    bySlug: (slug: string) => [...queryKeys.portals.all, 'slug', slug] as const,
    policies: (portalSlug: string) => [...queryKeys.portals.all, portalSlug, 'policies'] as const,
    assignments: (portalId: number) => [...queryKeys.portals.all, portalId, 'assignments'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.notifications.all, 'list', filters] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: (orgId?: number) => [...queryKeys.dashboard.all, 'stats', orgId] as const,
    analytics: (filters?: Record<string, unknown>) =>
      [...queryKeys.dashboard.all, 'analytics', filters] as const,
  },

  // Settings
  settings: {
    all: ['settings'] as const,
    organization: (orgId: number) => [...queryKeys.settings.all, 'org', orgId] as const,
    branding: (orgId: number) => [...queryKeys.settings.all, 'branding', orgId] as const,
    layoutTemplates: () => [...queryKeys.settings.all, 'layoutTemplates'] as const,
    documentLayout: (orgId: number) => [...queryKeys.settings.all, 'documentLayout', orgId] as const,
  },

  // Email Acknowledgments
  emailAcknowledgments: {
    all: ['emailAcknowledgments'] as const,
    pending: (filters?: Record<string, unknown>) =>
      [...queryKeys.emailAcknowledgments.all, 'pending', filters] as const,
    stats: (orgId?: number) => [...queryKeys.emailAcknowledgments.all, 'stats', orgId] as const,
    report: (filters?: Record<string, unknown>) =>
      [...queryKeys.emailAcknowledgments.all, 'report', filters] as const,
  },

  // AI features
  ai: {
    all: ['ai'] as const,
    suggestions: (policyId?: number) => [...queryKeys.ai.all, 'suggestions', policyId] as const,
    taxonomies: (orgId?: number) => [...queryKeys.ai.all, 'taxonomies', orgId] as const,
  },
} as const;

// Legacy export for backward compatibility
export const POLICIES_QUERY_KEY = queryKeys.policies.all;
export const AUTH_QUERY_KEY = queryKeys.auth.session();

/**
 * Helper to invalidate all queries for a resource
 * @example queryClient.invalidateQueries({ queryKey: queryKeys.policies.all })
 */
export function invalidateResource(
  queryClient: { invalidateQueries: (options: { queryKey: QueryKey }) => void },
  resource: QueryKey
) {
  queryClient.invalidateQueries({ queryKey: resource });
}
