import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  policyIds: z.array(z.number().int().positive()).min(1, "At least one policy is required"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
  deletedCount: number;
};

export const bulkDeletePolicies = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/policies/bulk-delete`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();

  if (!result.ok) {
    try {
      const errorObject = superjson.parse(text);
      throw new Error((errorObject as any).error);
    } catch (parseError) {
      // If we can't parse the error response, throw with the raw text
      throw new Error(text || `Request failed with status ${result.status}`);
    }
  }

  return superjson.parse<OutputType>(text);
};
