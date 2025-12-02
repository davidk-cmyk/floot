import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Policies } from "../../helpers/schema";

export const schema = z.object({
  portalId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type InputType = z.infer<typeof schema>;

export type PolicyAssignment = Selectable<Policies> & {
  assignedAt: Date;
};

export type OutputType = {
  assignments: PolicyAssignment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getPortalAssignments = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.set("portalId", String(params.portalId));
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const result = await fetch(
    `/_api/portals/assignments?${searchParams.toString()}`,
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