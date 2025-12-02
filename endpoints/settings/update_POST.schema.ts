import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Settings } from "../../helpers/schema";

export const schema = z.object({
  settingKey: z.string().min(1, "Setting key is required."),
  settingValue: z.any(), // The value is a JSON type in the database
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<Settings>;

export const postUpdateSettings = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/settings/update`, {
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
    throw new Error((errorObject as any).error);
  }
  return superjson.parse<OutputType>(await result.text());
};