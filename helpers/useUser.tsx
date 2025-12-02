import { useQuery } from "@tanstack/react-query";
import { postUsersGet } from "../endpoints/users/get_POST.schema";

export const useUserQueryKey = (userId: number | undefined | null) => ["user", userId] as const;

/**
 * A React Query hook to fetch details for a specific user.
 * @param userId The ID of the user to fetch. The query will not run if the ID is null or undefined.
 */
export const useUser = (userId: number | undefined | null) => {
  return useQuery({
    queryKey: useUserQueryKey(userId),
    queryFn: () => postUsersGet({ userId: userId! }),
    enabled: !!userId, // Only run the query if userId is a valid number
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};