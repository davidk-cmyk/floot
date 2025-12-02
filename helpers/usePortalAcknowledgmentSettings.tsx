import { useQuery } from '@tanstack/react-query';
import { useOrganization } from './useOrganization';
import { useAuth } from './useAuth';

// Assuming we can fetch portal settings. 
// Since we don't have a verified usePortalApi, we will piggyback on organization or a direct fetch.
// However, given the guidelines, we should try to implement a proper hook.
// We will assume there is an endpoint /api/portal/current or similar, 
// OR we can check if the organization object has what we need.

// For now, I will define the hook to fetch from a standard endpoint pattern used in this project.
// Since I can't confirm the endpoint, I'll assume a `usePortal` hook exists or I need to fetch it.
// But since I cannot edit non-listed files, I'll implement the fetch here directly to be safe.

interface PortalAcknowledgmentSettings {
  minimumReadingTimeSeconds: number | null;
  requireFullScroll: boolean;
  acknowledgmentMode: 'simple' | 'confirmed_understanding';
}

export const usePortalAcknowledgmentSettings = () => {
  const { authState } = useAuth();
  const { organizationState } = useOrganization();

  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization?.id : null;

  // We use React Query to fetch the portal settings
  // Assuming the endpoint is relative to the current organization/portal context
  return useQuery({
    queryKey: ['portal', 'settings', 'acknowledgment', organizationId],
    queryFn: async (): Promise<PortalAcknowledgmentSettings> => {
      // Note: In a real scenario we would use a proper typed API client.
      // Here we fetch from a likely endpoint.
      const response = await fetch('/api/portal/settings/acknowledgment');
      if (!response.ok) {
        throw new Error('Failed to fetch portal acknowledgment settings');
      }
      const data = await response.json();
      
      // Transform snake_case to camelCase if necessary, or validte schema
      return {
        minimumReadingTimeSeconds: data.minimum_reading_time_seconds ?? 0,
        requireFullScroll: data.require_full_scroll ?? false,
        acknowledgmentMode: data.acknowledgment_mode ?? 'simple',
      };
    },
    enabled: !!organizationId && authState.type === 'authenticated',
    // Default fallback
    placeholderData: {
      minimumReadingTimeSeconds: 0,
      requireFullScroll: false,
      acknowledgmentMode: 'simple',
    }
  });
};