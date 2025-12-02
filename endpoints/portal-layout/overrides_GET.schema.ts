import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { PortalLayoutOverrides } from "../../helpers/schema";

export const schema = z.object({
  portalId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<PortalLayoutOverrides>;

export const getGetPortalLayoutOverrides = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const params = new URLSearchParams({
    portalId: validatedInput.portalId.toString(),
  });

  const result = await fetch(`/_api/portal-layout/overrides?${params}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error(
      (errorObject as { error: string }).error ||
        "Failed to fetch portal layout overrides"
    );
  }
  return superjson.parse<OutputType>(await result.text());
};