import { useQuery } from "@tanstack/react-query";
import { postUsersGet } from "../endpoints/users/get_POST.schema";

// User lookup hook that fetches user data from the users/get endpoint
export const useUserLookup = (userId: number | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      try {
        const response = await postUsersGet({ userId });
        return response.user;
      } catch (error) {
        console.error("Failed to fetch user in useUserLookup:", error);
        throw error;
      }
    },
    enabled: !!userId && enabled,
    staleTime: 10 * 60 * 1000, // Cache user data for 10 minutes
  });
};