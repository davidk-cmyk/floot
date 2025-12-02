import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Policies } from "../../helpers/schema";

export const schema = z.object({
  portalId: z.coerce.number().int().positive(),
  search: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  policies: Selectable<Policies>[];
};

export const getAvailablePolicies = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.set("portalId", String(params.portalId));
  if (params.search) searchParams.set("search", params.search);

  const result = await fetch(
    `/_api/portals/available-policies?${searchParams.toString()}`,
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