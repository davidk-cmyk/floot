import { z } from "zod";
import superjson from "superjson";
import { documentLayoutSchema, DOCUMENT_LAYOUT_SETTING_KEY } from "./document-layout_GET.schema";

export { DOCUMENT_LAYOUT_SETTING_KEY };

export const schema = documentLayoutSchema.extend({
  portalId: z.number().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = z.infer<typeof schema>;

export const postUpdateDocumentLayout = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/document-layout`, {
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
    throw new Error((errorObject as any).error);
  }
  return superjson.parse<OutputType>(await result.text());
};