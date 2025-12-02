import { z } from "zod";
import superjson from "superjson";
import { formatEnum } from "../download_POST.schema";
import { OutputType as GetOutputType } from "./settings_GET.schema";

export const schema = z.object({
  enabledFormats: z.array(formatEnum).nonempty(),
  headerTemplate: z.string().optional().nullable(),
  footerTemplate: z.string().optional().nullable(),
  brandingEnabled: z.boolean().optional().nullable(),
  includeToc: z.boolean().optional().nullable(),
  rateLimitPerMinute: z.number().int().positive().optional().nullable(),
  dateFormat: z.string().optional().nullable(),
  pageNumberFormat: z.string().optional().nullable(),
  showMetadata: z.boolean().optional().nullable(),
  layoutTemplateId: z.number().int().positive().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = GetOutputType;

export const postUpdateDownloadSettings = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/policies/download/settings`, {
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
        "Failed to update download settings"
    );
  }
  return superjson.parse<OutputType>(await result.text());
};