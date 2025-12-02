import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType =
  | {
      success: true;
      message: string;
      processedOrganizations: number;
      updatedOrganizations: number;
      migrationDetails: {
        organizationName: string;
        settingsAdded: string[];
      }[];
    }
  | {
      success?: false;
      error: string;
      message?: string;
    };

export const postOrganizationsMigrateDefaults = async (
  body: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/organizations/migrate-defaults`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    try {
      const errorObject = superjson.parse(text) as { error?: string };
      throw new Error(errorObject.error || "An unknown error occurred");
    } catch (e) {
      // If parsing fails, it might be a plain text error from the server
      throw new Error(text || "An unknown error occurred");
    }
  }

  return superjson.parse<OutputType>(text);
};