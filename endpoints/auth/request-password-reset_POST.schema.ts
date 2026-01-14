import { z } from "zod";

export const schema = z.object({
  email: z.string().email("Valid email is required"),
});

export type OutputType = {
  success: boolean;
  message: string;
};

export const postRequestPasswordReset = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/request-password-reset`, {
    method: "POST",
    body: JSON.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.message || "Request failed");
  }

  return result.json();
};
