import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Policies } from "../helpers/schema";

export const schema = z.object({
  portalSlug: z.string(),
  search: z.string().optional(),
  status: z.string().optional(),
  department: z.string().optional(),
  category: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  password: z.string().optional(), // For password-protected portals
});

export type InputType = z.infer<typeof schema>;

export type PolicyWithAcknowledgement = Selectable<Policies> & {
  acknowledged: boolean;
};

export type PublicPortalInfo = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  accessType: string;
  acknowledgmentMode: string | null;
};

export type OutputType = {
  portal: PublicPortalInfo;
  policies: PolicyWithAcknowledgement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getPortalPolicies = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();

  searchParams.set("portalSlug", params.portalSlug);
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.department) searchParams.set("department", params.department);
  if (params.category) searchParams.set("category", params.category);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.password) searchParams.set("password", params.password);

  const result = await fetch(
    `/_api/portalPolicies?${searchParams.toString()}`,
    {
      method: "GET",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    }
  );

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any).error);
  }
  return superjson.parse<OutputType>(await result.text());
};