import { z } from "zod";
import superjson from "superjson";
import { Organization } from "../../helpers/Organization";

export const schema = z.object({
  name: z.string().min(1, "Organization name is required."),
  domain: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  organization: Organization;
};

export const postCreateOrganization = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/organizations/create`, {
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
    throw new Error(errorObject.error || "Failed to create organization");
  }

  return superjson.parse<OutputType>(await result.text());
};