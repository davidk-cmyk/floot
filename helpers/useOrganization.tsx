import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, AUTH_QUERY_KEY } from './useAuth';
import { Organization } from './Organization';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getListOrganizations } from '../endpoints/organizations/list_GET.schema';
import { postSwitchOrganization } from '../endpoints/organizations/switch_POST.schema';
import { toast } from 'sonner';

export const ORGANIZATION_QUERY_KEY = ['organizations'] as const;

type OrganizationState =
  | {
      type: 'loading';
    }
  | {
      type: 'no-organization';
      availableOrganizations: Organization[];
    }
  | {
      type: 'active';
      currentOrganization: Organization;
      availableOrganizations: Organization[];
    }
  | {
      type: 'switching';
      currentOrganization?: Organization;
      availableOrganizations: Organization[];
    };

type OrganizationContextType = {
  organizationState: OrganizationState;
  switchOrganization: (organizationId: number) => void;
  refetchOrganizations: () => void;
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  const queryClient = useQueryClient();
  const [currentOrganizationId, setCurrentOrganizationId] = useState<number | null>(null);

  const { data: organizations, status: organizationsStatus, refetch } = useQuery({
    queryKey: ORGANIZATION_QUERY_KEY,
    queryFn: () => getListOrganizations().then(res => res.organizations),
    enabled: authState.type === 'authenticated',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const switchMutation = useMutation({
    mutationFn: postSwitchOrganization,
    onSuccess: (data) => {
      // Update the user's auth session data with the new organizationId
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
      setCurrentOrganizationId(data.user.organizationId);
      
      // Invalidate all queries to refetch data for the new organization context
      queryClient.invalidateQueries();

      toast.success("Switched organization successfully.");
    },
    onError: (error) => {
      toast.error(`Failed to switch organization: ${error.message}`);
    },
  });

  useEffect(() => {
    if (authState.type === 'authenticated' && authState.user.organizationId) {
      setCurrentOrganizationId(authState.user.organizationId);
    } else {
      setCurrentOrganizationId(null);
    }
  }, [authState]);

  const switchOrganization = useCallback((organizationId: number) => {
    if (currentOrganizationId === organizationId) {
      return; // Already in this organization
    }
    console.log(`Switching to organization ${organizationId}`);
    switchMutation.mutate({ organizationId });
  }, [switchMutation, currentOrganizationId]);

  const refetchOrganizations = useCallback(() => {
    refetch();
  }, [refetch]);

  let organizationState: OrganizationState;

  if (authState.type === 'loading' || (authState.type === 'authenticated' && organizationsStatus === 'pending')) {
    organizationState = { type: 'loading' };
  } else if (authState.type === 'unauthenticated' || !organizations) {
    organizationState = { type: 'no-organization', availableOrganizations: [] };
  } else {
    const currentOrganization = organizations.find(org => org.id === currentOrganizationId);
    if (switchMutation.isPending) {
      organizationState = {
        type: 'switching',
        currentOrganization,
        availableOrganizations: organizations,
      };
    } else if (currentOrganization) {
      organizationState = {
        type: 'active',
        currentOrganization,
        availableOrganizations: organizations,
      };
    } else {
      organizationState = {
        type: 'no-organization',
        availableOrganizations: organizations,
      };
    }
  }

  return (
    <OrganizationContext.Provider value={{ organizationState, switchOrganization, refetchOrganizations }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};