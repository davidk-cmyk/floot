import { z } from "zod";
import superjson from "superjson";
import { formatEnum } from "../download_POST.schema";

export const schema = z.object({
  policyIds: z.array(z.number().int().positive()).nonempty(),
  format: formatEnum,
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  data: string; // base64 encoded zip file content
  mimeType: string;
  filename: string;
  processedCount: number;
  requestedCount: number;
};

export const postBulkDownloadPolicies = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/policies/download/bulk`, {
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
        "Failed to bulk download policies"
    );
  }
  return superjson.parse<OutputType>(await result.text());
};