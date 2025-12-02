import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationsList,
  InputType as ListInputType,
} from "../endpoints/notifications/list_GET.schema";
import { postMarkNotificationRead } from "../endpoints/notifications/mark-read_POST.schema";
import { postMarkAllNotificationsRead } from "../endpoints/notifications/mark-all-read_POST.schema";
import { postBulkReadNotifications } from "../endpoints/notifications/bulk-read_POST.schema";
import { useAuth } from "./useAuth";

export const NOTIFICATIONS_QUERY_KEY = "notifications";

/**
 * Hook to fetch a paginated list of notifications for the current user.
 * Includes real-time polling to keep the data fresh.
 * @param params - Pagination and filtering options.
 */
export const useNotificationsList = (params: ListInputType) => {
  const { authState } = useAuth();
  const isEnabled = authState.type === "authenticated";

  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, params],
    queryFn: () => getNotificationsList(params),
    enabled: isEnabled,
    refetchInterval: 60000, // Poll every 60 seconds
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Enhanced hook to fetch notifications with comprehensive filtering, sorting, and search.
 * Supports all advanced features required by the notifications management page.
 * @param params - Advanced filtering, sorting, and search parameters.
 * @param options - Additional query options like polling interval.
 */
export const useAdvancedNotificationsList = (
  params: ListInputType,
  options?: {
    pollingEnabled?: boolean;
    pollingInterval?: number;
  }
) => {
  const { authState } = useAuth();
  const isEnabled = authState.type === "authenticated";
  const { pollingEnabled = true, pollingInterval = 60000 } = options ?? {};

  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, "advanced", params],
    queryFn: () => getNotificationsList(params),
    enabled: isEnabled,
    refetchInterval: pollingEnabled ? pollingInterval : false,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook to get a count of unread notifications.
 * This is a lightweight query for use in UI elements like badges.
 */
export const useUnreadNotificationsCount = () => {
  const { authState } = useAuth();
  const isEnabled = authState.type === "authenticated";

  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, "unread", "count"],
    queryFn: async () => {
      const data = await getNotificationsList({
        limit: 1,
        page: 1,
        status: "unread",
        sortBy: "date",
        sortOrder: "desc",
      });
      return data.total;
    },
    enabled: isEnabled,
    refetchInterval: 60000, // Poll every 60 seconds
  });
};

/**
 * Mutation hook to mark one or more notifications as read.
 * Invalidates notification queries to refetch updated data.
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postMarkNotificationRead,
    onSuccess: () => {
      // Invalidate all queries related to notifications to refetch
      return queryClient.invalidateQueries({
        queryKey: [NOTIFICATIONS_QUERY_KEY],
      });
    },
  });
};

/**
 * Mutation hook to mark all notifications as read.
 * Invalidates notification queries to refetch updated data.
 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postMarkAllNotificationsRead,
    onSuccess: () => {
      // Invalidate all queries related to notifications to refetch
      return queryClient.invalidateQueries({
        queryKey: [NOTIFICATIONS_QUERY_KEY],
      });
    },
  });
};

/**
 * Mutation hook to mark multiple specific notifications as read.
 * Accepts an array of notification IDs and marks them all as read in bulk.
 * Invalidates notification queries to refetch updated data.
 */
export const useBulkMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postBulkReadNotifications,
    onSuccess: () => {
      // Invalidate all queries related to notifications to refetch
      return queryClient.invalidateQueries({
        queryKey: [NOTIFICATIONS_QUERY_KEY],
      });
    },
  });
};

/**
 * Helper function to convert notification filter parameters to URL search parameters.
 * Useful for syncing notification filters with URL state.
 */
export const notificationFiltersToURLParams = (filters: Partial<ListInputType>): URLSearchParams => {
  const searchParams = new URLSearchParams();
  
  if (filters.page !== undefined && filters.page !== 1) {
    searchParams.set("page", filters.page.toString());
  }
  if (filters.limit !== undefined && filters.limit !== 10) {
    searchParams.set("limit", filters.limit.toString());
  }
  if (filters.status !== undefined && filters.status !== "all") {
    searchParams.set("status", filters.status);
  }
  if (filters.types && filters.types.length > 0) {
    filters.types.forEach(type => searchParams.append("types", type));
  }
  if (filters.dateRange) {
    searchParams.set("dateRange", filters.dateRange);
  }
  if (filters.startDate) {
    searchParams.set("startDate", filters.startDate.toISOString());
  }
  if (filters.endDate) {
    searchParams.set("endDate", filters.endDate.toISOString());
  }
  if (filters.priority) {
    searchParams.set("priority", filters.priority);
  }
  if (filters.sortBy !== undefined && filters.sortBy !== "date") {
    searchParams.set("sortBy", filters.sortBy);
  }
  if (filters.sortOrder !== undefined && filters.sortOrder !== "desc") {
    searchParams.set("sortOrder", filters.sortOrder);
  }
  if (filters.search) {
    searchParams.set("search", filters.search);
  }

  return searchParams;
};

/**
 * Helper function to parse URL search parameters into notification filter parameters.
 * Useful for syncing URL state with notification filters.
 */
export const urlParamsToNotificationFilters = (searchParams: URLSearchParams): Partial<ListInputType> => {
  const filters: Partial<ListInputType> = {};
  
  const pageParam = searchParams.get("page");
  if (pageParam) {
    const page = parseInt(pageParam, 10);
    if (!isNaN(page) && page > 0) {
      filters.page = page;
    }
  }
  
  const limitParam = searchParams.get("limit");
  if (limitParam) {
    const limit = parseInt(limitParam, 10);
    if (!isNaN(limit) && limit > 0 && limit <= 100) {
      filters.limit = limit;
    }
  }
  
  const statusParam = searchParams.get("status");
  if (statusParam && ["read", "unread", "all"].includes(statusParam)) {
    filters.status = statusParam as "read" | "unread" | "all";
  }
  
  const typesParams = searchParams.getAll("types");
  if (typesParams.length > 0) {
    filters.types = typesParams;
  }
  
  const dateRangeParam = searchParams.get("dateRange");
  if (dateRangeParam && ["today", "week", "month", "custom"].includes(dateRangeParam)) {
    filters.dateRange = dateRangeParam as "today" | "week" | "month" | "custom";
  }
  
  const startDateParam = searchParams.get("startDate");
  if (startDateParam) {
    try {
      filters.startDate = new Date(startDateParam);
    } catch (error) {
      console.warn("Invalid startDate parameter:", startDateParam);
    }
  }
  
  const endDateParam = searchParams.get("endDate");
  if (endDateParam) {
    try {
      filters.endDate = new Date(endDateParam);
    } catch (error) {
      console.warn("Invalid endDate parameter:", endDateParam);
    }
  }
  
  const priorityParam = searchParams.get("priority");
  if (priorityParam && ["high", "medium", "low"].includes(priorityParam)) {
    filters.priority = priorityParam as "high" | "medium" | "low";
  }
  
  const sortByParam = searchParams.get("sortBy");
  if (sortByParam && ["date", "priority", "type", "status"].includes(sortByParam)) {
    filters.sortBy = sortByParam as "date" | "priority" | "type" | "status";
  }
  
  const sortOrderParam = searchParams.get("sortOrder");
  if (sortOrderParam && ["asc", "desc"].includes(sortOrderParam)) {
    filters.sortOrder = sortOrderParam as "asc" | "desc";
  }
  
  const searchParam = searchParams.get("search");
  if (searchParam) {
    filters.search = searchParam;
  }

  return filters;
};