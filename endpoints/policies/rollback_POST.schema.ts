import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Policies } from "../../helpers/schema";

export const schema = z.object({
  policyId: z.number().int().positive(),
  versionNumber: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<Policies>;

export const postRollbackPolicy = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/policies/rollback`, {
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