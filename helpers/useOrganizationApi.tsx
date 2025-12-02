import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  postRegisterOrganization,
  InputType as RegisterOrgInput,
  OutputType as RegisterOrgOutput,
} from '../endpoints/organizations/register_POST.schema';
import {
  postUpdateOrganization,
  InputType as UpdateOrgInput,
  OutputType as UpdateOrgOutput,
} from '../endpoints/organizations/update_POST.schema';
import {
  getOrganizationBySlug,
  OutputType as GetOrgOutput,
} from '../endpoints/organizations/get_by_slug_GET.schema';
import {
  postOrganizationsDelete,
  InputType as DeleteOrgInput,
  OutputType as DeleteOrgOutput,
} from '../endpoints/organizations/delete_POST.schema';

export const ORGANIZATION_QUERY_KEY = 'organizations';

export const useRegisterOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation<RegisterOrgOutput, Error, RegisterOrgInput>({
    mutationFn: (data) => postRegisterOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORGANIZATION_QUERY_KEY] });
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation<UpdateOrgOutput, Error, UpdateOrgInput>({
    mutationFn: (data) => postUpdateOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORGANIZATION_QUERY_KEY] });
    },
  });
};

export const useOrganizationBySlug = (slug: string | undefined) => {
  return useQuery<GetOrgOutput, Error>({
    queryKey: [ORGANIZATION_QUERY_KEY, 'slug', slug],
    queryFn: () => getOrganizationBySlug({ slug: slug! }),
    enabled: !!slug,
  });
};

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  
  return useMutation<DeleteOrgOutput, Error, DeleteOrgInput>({
    mutationFn: (data) => postOrganizationsDelete(data),
    onSuccess: async () => {
      // Invalidate organization queries
      queryClient.invalidateQueries({ queryKey: [ORGANIZATION_QUERY_KEY] });
      
      // Since the user's organization is deleted, logout the user
      console.log('Organization deleted successfully, logging out user');
      await logout();
    },
    onError: (error) => {
      console.error('Failed to delete organization:', error);
    },
  });
};

export const useCreateOrganization = () => {
  return useRegisterOrganization();
};

export const useOrganizationApi = () => {
  return {
    useRegisterOrganization,
    useUpdateOrganization,
    useOrganizationBySlug,
    useCreateOrganization,
    useDeleteOrganization,
  };
};