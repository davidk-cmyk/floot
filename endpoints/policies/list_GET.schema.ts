import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Policies, Portals } from "../../helpers/schema";

export const schema = z.object({
  // Search
  search: z.string().optional(),
  
  // Filters
  status: z.string().optional(),
  department: z.string().optional(),
  category: z.string().optional(),
  portal: z.string().optional(),
  tags: z.array(z.string()).optional(),
  requiresAcknowledgment: z.boolean().optional(),
  
  // Sorting
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'effectiveDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  
  // Pagination
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  
  // Special modes
  publicOnly: z.boolean().optional(),
  getFilterMetadata: z.boolean().optional(),
});

export type InputType = z.infer<typeof schema>;

export type PolicyWithAcknowledgement = Selectable<Policies> & {
  acknowledged: boolean;
  acknowledgedCount: number;
  assignedCount: number;
  overdueCount: number;
  dueSoonCount: number;
  requiresAcknowledgmentFromPortals: boolean;
  assignedPortals: Array<{
    id: number;
    name: string;
    slug: string;
    requiresAcknowledgment: boolean;
  }>;
};

export type FilterMetadata = {
  departments: string[];
  categories: string[];
  statuses: string[];
  tags: string[];
  portals: string[];
};

export type OutputType = {
  policies: PolicyWithAcknowledgement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filterMetadata?: FilterMetadata;
};

export const getListPolicies = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.department) searchParams.set("department", params.department);
  if (params.category) searchParams.set("category", params.category);
  if (params.portal) searchParams.set("portal", params.portal);
  if (params.tags) {
    params.tags.forEach(tag => searchParams.append("tags", tag));
  }
  if (params.requiresAcknowledgment !== undefined)
    searchParams.set("requiresAcknowledgment", String(params.requiresAcknowledgment));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.publicOnly) searchParams.set("publicOnly", String(params.publicOnly));
  if (params.getFilterMetadata) searchParams.set("getFilterMetadata", String(params.getFilterMetadata));

  const result = await fetch(`/_api/policies/list?${searchParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = JSON.parse(await result.text());
    throw new Error((errorObject as any).error);
  }
  return superjson.parse(await result.text()) as OutputType;
};