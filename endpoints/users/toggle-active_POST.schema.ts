import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  userId: z.number().int().positive(),
  isActive: z.boolean(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = { success: true } | { error: string };

export const postUsersToggleActive = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/users/toggle-active`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = await result.json().catch(() => ({ error: "An unknown error occurred" }));
    throw new Error(errorObject.error || "Failed to toggle user active status");
  }
  
  return superjson.parse<OutputType>(await result.text());
};