import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postUsersDelete } from "../endpoints/users/delete_POST.schema";
import { postUsersToggleActive } from "../endpoints/users/toggle-active_POST.schema";
import { postUsersDropPassword, OutputType as DropPasswordOutputType } from "../endpoints/users/drop-password_POST.schema";
import { postUsersUpdateRole } from "../endpoints/users/update-role_POST.schema";
import { postUsersCreate, InputType as CreateUserInputType, OutputType as CreateUserOutputType } from "../endpoints/users/create_POST.schema";
import { getUsersListQueryKey } from "./useUsers";
import { useOrganization } from "./useOrganization";

export const useUserManagement = () => {
  const queryClient = useQueryClient();
  const { organizationState } = useOrganization();

  const invalidateUsersList = () => {
    const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;
    const queryKey = getUsersListQueryKey(organizationId);

    // Mark queries as stale
    queryClient.invalidateQueries({ 
      queryKey,
    });
    // Immediately refetch any active queries
    queryClient.refetchQueries({
      queryKey,
    });
  };

  const useDeleteUser = () =>
    useMutation({
      mutationFn: postUsersDelete,
      onSuccess: () => {
        toast.success("User deleted successfully.");
        invalidateUsersList();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete user.");
      },
    });

  const useToggleUserActive = () =>
    useMutation({
      mutationFn: postUsersToggleActive,
      onSuccess: (_, variables) => {
        toast.success(
          `User has been ${variables.isActive ? "activated" : "deactivated"}.`
        );
        invalidateUsersList();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update user status.");
      },
    });

  const useDropUserPassword = () =>
    useMutation<DropPasswordOutputType, Error, { userId: number }>({
      mutationFn: postUsersDropPassword,
      onSuccess: (data) => {
        if ('success' in data && data.success) {
          toast.success(`User password has been generated. New password: ${data.password}`);
        }
        invalidateUsersList();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to drop user password.");
      },
    });

  const useUpdateUserRole = () =>
    useMutation({
      mutationFn: postUsersUpdateRole,
      onSuccess: () => {
        toast.success("User role updated successfully.");
        invalidateUsersList();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update user role.");
      },
    });

  const useCreateUser = () =>
    useMutation<CreateUserOutputType, Error, CreateUserInputType>({
      mutationFn: postUsersCreate,
      onSuccess: (data) => {
        toast.success(`User created successfully. Password: ${data.password}`);
        invalidateUsersList();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create user.");
      },
    });

  return {
    useDeleteUser,
    useToggleUserActive,
    useDropUserPassword,
    useUpdateUserRole,
    useCreateUser,
  };
};