import { z } from "zod";
import superjson from "superjson";
import { UserRoleArrayValues } from "../../helpers/schema";

export const schema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(UserRoleArrayValues),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = { success: true } | { error: string };

export const postUsersUpdateRole = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/users/update-role`, {
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
    throw new Error(errorObject.error || "Failed to update user role");
  }
  
  return superjson.parse<OutputType>(await result.text());
};