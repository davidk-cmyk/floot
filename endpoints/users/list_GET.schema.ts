import { z } from "zod";
import superjson from "superjson";
import type { UserRole } from "../../helpers/schema";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type UserListItem = {
  id: number;
  email: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  createdAt: Date | null;
  isActive: boolean | null;
  hasLoggedIn: boolean | null;
};

export type OutputType = {
  users: UserListItem[];
};

export const getUsersList = async (
  body: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/users/list`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = await result.json().catch(() => ({ error: "An unknown error occurred" }));
    throw new Error(errorObject.error || "Failed to fetch users list");
  }

  return superjson.parse<OutputType>(await result.text());
};