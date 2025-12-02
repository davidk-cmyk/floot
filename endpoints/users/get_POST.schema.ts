import { z } from "zod";
import superjson from "superjson";
import type { UserRole } from "../../helpers/schema";

export const schema = z.object({
  userId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type UserDetails = {
  id: number;
  displayName: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: Date | null;
  isActive: boolean | null;
  oauthProvider: string | null;
};

export type OutputType = {
  user: UserDetails;
};

export const postUsersGet = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/users/get`, {
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
    throw new Error(errorObject.error || `Failed to fetch user: ${result.statusText}`);
  }

  return superjson.parse<OutputType>(await result.text());
};