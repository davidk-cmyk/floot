import { z } from "zod";
import superjson from "superjson";
import { supportedFormats } from "../../helpers/policyDownloadConstants";

export { supportedFormats };
export const formatEnum = z.enum(supportedFormats);
export type DownloadFormat = z.infer<typeof formatEnum>;

export const schema = z.object({
  policyId: z.number().int().positive(),
  format: formatEnum,
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  data: string; // base64 encoded file content
  mimeType: string;
  filename: string;
};

export const postDownloadPolicy = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/policies/download`, {
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
      (errorObject as { error: string }).error || "Failed to download policy"
    );
  }
  return superjson.parse<OutputType>(await result.text());
};