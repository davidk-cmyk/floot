import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { PolicyReadingSessions } from "../../../helpers/schema";

export const schema = z.object({
  sessionId: z.number().int().positive(),
  completionPercentage: z.number().min(0).max(100),
  pagesVisited: z.number().int().min(0),
  isFinalUpdate: z.boolean().optional().default(false),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<PolicyReadingSessions>;

export const postUpdateReading = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/policies/reading/update`, {
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