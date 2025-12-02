import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Settings } from "../../helpers/schema";

export const schema = z.object({
  settingKeys: z
    .array(z.string())
    .min(1, "At least one setting key is required."),
  organizationId: z.number().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Record<string, Selectable<Settings> | null>;

export const getManySettings = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(params);
  const searchParams = new URLSearchParams();
  validatedInput.settingKeys.forEach((key) =>
    searchParams.append("settingKeys", key)
  );
  
  if (validatedInput.organizationId !== undefined) {
    searchParams.set("organizationId", validatedInput.organizationId.toString());
  }

  const result = await fetch(
    `/_api/settings/getMany?${searchParams.toString()}`,
    {
      method: "GET",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    }
  );

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any).error);
  }
  return superjson.parse<OutputType>(await result.text());
};