import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { OrganizationDownloadSettings, LayoutTemplates } from "../../../helpers/schema";
import { supportedFormats } from "../../../helpers/policyDownloadConstants";

// No input schema for GET request
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = Omit<
  Selectable<OrganizationDownloadSettings>,
  "enabledFormats"
> & {
  enabledFormats: typeof supportedFormats;
  layoutTemplate?: Selectable<LayoutTemplates>;
};

export const getGetDownloadSettings = async (
  body: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/policies/download/settings`, {
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
        "Failed to fetch download settings"
    );
  }
  return superjson.parse<OutputType>(await result.text());
};