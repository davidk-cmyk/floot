import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  portalSlug: z.string().min(1, "Portal slug is required."),
  policyId: z.number().int().positive("Policy ID must be a positive integer."),
  email: z.string().email("Invalid email address."),
});

export type InputType = z.infer<typeof schema>;

export type OutputType =
  | {
      success: true;
      isAcknowledged: boolean;
      acknowledgedAt: Date | null;
    }
  | {
      success: false;
      message: string;
    };

export const postCheckAcknowledgment = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/portal/check-acknowledgment`, {
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
    throw new Error(
      "success" in responseJson && !responseJson.success
        ? responseJson.message
        : "An unknown error occurred"
    );
  }

  return responseJson;
};