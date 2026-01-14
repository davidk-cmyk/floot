import { z } from "zod";

export const schema = z.object({
  email: z.string().email("Valid email is required"),
  code: z.string().length(6, "Code must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type OutputType = {
  success: boolean;
  message: string;
};

export const postConfirmPasswordReset = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/confirm-password-reset`, {
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
    throw new Error(errorData.message || "Reset failed");
  }

  return result.json();
};
