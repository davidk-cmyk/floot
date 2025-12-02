import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { OrganizationVariables } from "../../helpers/schema";

const variableSchema = z.object({
  variableName: z
    .string()
    .min(1, "Variable name cannot be empty")
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      "Variable name can only contain letters, numbers, dots, and underscores"
    ),
  variableValue: z.string(),
});

export const schema = z.object({
  variables: z.array(variableSchema).min(1, "At least one variable is required"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  variables: Selectable<OrganizationVariables>[];
};

export const postUpdateOrganizationVariables = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/organization-variables/update`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error(
      (errorObject as { error: string }).error ||
        "Failed to update organization variables"
    );
  }
  return superjson.parse<OutputType>(await result.text());
};