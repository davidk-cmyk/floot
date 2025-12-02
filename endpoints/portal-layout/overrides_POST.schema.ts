import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { PortalLayoutOverrides } from "../../helpers/schema";

export const schema = z.object({
  portalId: z.number().int().positive(),
  headerOverride: z.string().nullable().optional(),
  footerOverride: z.string().nullable().optional(),
  metadataOverride: z.string().nullable().optional(),
  layoutTemplateId: z.number().int().positive().nullable().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  overrides: Selectable<PortalLayoutOverrides>;
};

export const postUpdatePortalLayoutOverrides = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/portal-layout/overrides`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
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
        "Failed to update portal layout overrides"
    );
  }
  return superjson.parse<OutputType>(await result.text());
};