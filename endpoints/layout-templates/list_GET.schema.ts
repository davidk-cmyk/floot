import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { LayoutTemplates } from "../../helpers/schema";

// No input schema for GET request
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<LayoutTemplates>[];

export const getGetLayoutTemplates = async (
  body: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/layout-templates/list`, {
    method: "GET",
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
        "Failed to fetch layout templates"
    );
  }
  return superjson.parse<OutputType>(await result.text());
};