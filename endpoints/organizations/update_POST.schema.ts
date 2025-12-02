import { z } from "zod";
import superjson from "superjson";
import { Organization } from "../../helpers/Organization";

export const schema = z.object({
  organizationId: z.number(),
  name: z.string().min(1, "Organization name is required.").optional(),
  slug: z
    .string()
    .min(1, "Slug is required.")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens."
    )
    .optional(),
  domain: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  organization: Organization;
};

export const postUpdateOrganization = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/organizations/update`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = await result
      .json()
      .catch(() => ({ error: "An unknown error occurred" }));
    throw new Error(errorObject.message || errorObject.error || "Failed to update organization");
  }

  return superjson.parse<OutputType>(await result.text());
};