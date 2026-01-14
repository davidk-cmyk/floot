import { z } from "zod";

// Password validation with complexity requirements
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const schema = z.object({
  email: z.string().email("Valid email is required"),
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must be 6 digits"),
  newPassword: passwordSchema,
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
