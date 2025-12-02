import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  userId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = { success: true; password: string } | { error: string };

export const postUsersDropPassword = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/users/drop-password`, {
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
    throw new Error(errorObject.error || "Failed to drop user password");
  }
  
  return superjson.parse<OutputType>(await result.text());
};