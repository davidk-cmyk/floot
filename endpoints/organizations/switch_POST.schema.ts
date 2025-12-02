import { z } from "zod";
import superjson from 'superjson';
import { User } from "../../helpers/User";

export const schema = z.object({
  organizationId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  user: User;
};

export const postSwitchOrganization = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/organizations/switch`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const responseText = await result.text();
  const responseJson = superjson.parse(responseText);

  if (!result.ok) {
    const errorMessage = (responseJson as { error?: string }).error || "Failed to switch organization";
    throw new Error(errorMessage);
  }

  return responseJson as OutputType;
};