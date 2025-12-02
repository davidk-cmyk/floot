import { z } from "zod";
import superjson from "superjson";

export const DOCUMENT_LAYOUT_SETTING_KEY = "document_layout";

export const dateFormatOptions = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "Month D, YYYY"] as const;
export const pageNumberingFormatOptions = ["Page {current} of {total}", "{current} / {total}", "{current}"] as const;

export const documentLayoutSchema = z.object({
  headerTemplate: z.string().default(""),
  footerTemplate: z.string().default(""),
  showMetadata: z.boolean().default(true),
  dateFormat: z.enum(dateFormatOptions).default("Month D, YYYY"),
  pageNumberingFormat: z.enum(pageNumberingFormatOptions).default("Page {current} of {total}"),
});

export const defaultDocumentLayoutSettings = documentLayoutSchema.parse({});

export const schema = z.object({
  portalId: z.number().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = z.infer<typeof documentLayoutSchema>;

export const getDocumentLayout = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(params);
  const searchParams = new URLSearchParams();
  if (validatedInput.portalId) {
    searchParams.set("portalId", validatedInput.portalId.toString());
  }

  const result = await fetch(`/_api/document-layout?${searchParams.toString()}`, {
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