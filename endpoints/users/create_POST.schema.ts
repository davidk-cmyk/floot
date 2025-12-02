import { z } from "zod";
import superjson from "superjson";
import { UserRoleArrayValues } from "../../helpers/schema";
import { User } from "../../helpers/User";

export const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(UserRoleArrayValues),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  user: User;
  password: string;
};

export const postUsersCreate = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/users/create`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse(await result.text()) as { error?: string };
    throw new Error(errorObject.error || "Failed to create user");
  }
  return superjson.parse<OutputType>(await result.text());
};