import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  slug: z.string().min(1, "Portal slug is required"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  id: number;
  slug: string;
  name: string;
  organizationId: number;
};

export const getPortalLookup = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(params);
  const queryString = new URLSearchParams({
    slug: validatedInput.slug,
  }).toString();
  
  const result = await fetch(`/_api/portals/lookup?${queryString}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(
      await result.text()
    );
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await result.text());
};