import { z } from "zod";
import superjson from "superjson";
import { Organization } from "../../helpers/Organization";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  organizations: Organization[];
};

export const getListOrganizations = async (
  body: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/organizations/list`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = await result.json().catch(() => ({ error: "An unknown error occurred" }));
    throw new Error(errorObject.error || "Failed to fetch organizations list");
  }

  return superjson.parse<OutputType>(await result.text());
};