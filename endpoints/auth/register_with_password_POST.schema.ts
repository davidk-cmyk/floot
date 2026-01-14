import { z } from "zod";
import { User } from "../../helpers/User";

// Password validation with complexity requirements
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const schema = z.object({
  email: z.string().email("Email is required"),
  password: passwordSchema,
  displayName: z.string().min(1, "Name is required"),
  organizationSlug: z.string().min(1, "Organization is required"),
});

export type OutputType = {
  user: User;
  isFirstLogin: boolean;
};

export const postRegister = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/register_with_password`, {
    method: "POST",
    body: JSON.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include", // Important for cookies to be sent and received
  });

  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.message || "Registration failed");
  }

  return result.json();
};
