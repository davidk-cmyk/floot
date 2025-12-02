import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Portals, UserRoleArrayValues } from "../../helpers/schema";

export const PortalAccessTypeSchema = z.enum([
  "public",
  "password",
  "authenticated",
  "role_based",
]);

export const schema = z.object({
  search: z.string().optional(),
  accessType: PortalAccessTypeSchema.optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  portals: (Selectable<Portals> & { 
    assignedPolicyCount: number;
    publishedPolicyCount: number;
    policyCount: number; // Backward compatibility - same as publishedPolicyCount
    emailRecipients: string[];
  })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getListPortals = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.accessType) searchParams.set("accessType", params.accessType);
  if (params.isActive !== undefined)
    searchParams.set("isActive", String(params.isActive));
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const result = await fetch(`/_api/portals/list?${searchParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any).error);
  }
  return superjson.parse<OutputType>(await result.text());
};