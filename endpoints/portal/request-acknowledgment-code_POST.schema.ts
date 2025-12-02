import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  portalSlug: z.string().min(1, "Portal slug is required."),
  policyId: z.number().int().positive("Policy ID must be a positive integer."),
  email: z.string().email("Invalid email address."),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
};

export const postRequestAcknowledgmentCode = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/portal/request-acknowledgment-code`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  
  const responseJson = superjson.parse<OutputType>(await result.text());

  if (!result.ok) {
    throw new Error(responseJson.message || "An unknown error occurred");
  }
  
  return responseJson;
};