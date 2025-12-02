import { useQuery } from "@tanstack/react-query";
import { getUsersList, UserListItem } from "../endpoints/users/list_GET.schema";
import { useOrganization } from "./useOrganization";

const USERS_LIST_QUERY_KEY_BASE = ["users", "list"] as const;

/**
 * Factory function to create a consistent query key for the users list.
 * This ensures that query invalidation targets the exact same cache entry.
 * 
 * @param organizationId The organization ID to scope the query to
 * @returns The complete query key including the organization ID
 */
export const getUsersListQueryKey = (organizationId: number | null) => [
  ...USERS_LIST_QUERY_KEY_BASE,
  { organizationId },
] as const;

/**
 * A React Query hook to fetch the list of all users.
 * This hook should only be used in components accessible to 'admin' or 'editor' roles.
 * The underlying endpoint will enforce this, but for a better user experience,
 * UI components using this hook should also be conditionally rendered based on user role.
 *
 * @returns The result of the useQuery hook for the users list.
 */
export const useUsers = () => {
  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;
  
  return useQuery<
    { users: UserListItem[] },
    Error
  >({
    queryKey: getUsersListQueryKey(organizationId),
    queryFn: () => getUsersList(),
    enabled: organizationState.type !== 'loading',
  });
};