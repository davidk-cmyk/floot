import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Notifications } from "../../helpers/schema";

export const schema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  status: z.enum(["read", "unread", "all"]).optional().default("all"),
  types: z.array(z.string()).optional(),
  dateRange: z.enum(["today", "week", "month", "custom"]).optional(),
  startDate: z.string().nullable().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().nullable().optional().transform((val) => val ? new Date(val) : undefined),
  priority: z.enum(["high", "medium", "low"]).optional(),
  sortBy: z.enum(["date", "priority", "type", "status"]).optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  notifications: (Selectable<Notifications> & {
    relatedPolicyTitle?: string | null;
    relatedUserName?: string | null;
  })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
};

export const getNotificationsList = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams();
  
  searchParams.set("page", validatedParams.page.toString());
  searchParams.set("limit", validatedParams.limit.toString());
  searchParams.set("status", validatedParams.status);
  
  if (validatedParams.types) {
    validatedParams.types.forEach(type => searchParams.append("types", type));
  }
  if (validatedParams.dateRange) {
    searchParams.set("dateRange", validatedParams.dateRange);
  }
  if (validatedParams.startDate) {
    searchParams.set("startDate", validatedParams.startDate.toISOString());
  }
  if (validatedParams.endDate) {
    searchParams.set("endDate", validatedParams.endDate.toISOString());
  }
  if (validatedParams.priority) {
    searchParams.set("priority", validatedParams.priority);
  }
  if (validatedParams.sortBy) {
    searchParams.set("sortBy", validatedParams.sortBy);
  }
  if (validatedParams.sortOrder) {
    searchParams.set("sortOrder", validatedParams.sortOrder);
  }
  if (validatedParams.search) {
    searchParams.set("search", validatedParams.search);
  }

  const result = await fetch(`/_api/notifications/list?${searchParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error(String(errorObject));
  }
  return superjson.parse<OutputType>(await result.text());
};