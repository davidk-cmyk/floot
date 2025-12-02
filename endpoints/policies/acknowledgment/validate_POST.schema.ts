import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  policyId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  canAcknowledge: boolean;
  requirements: {
    quizPassed: boolean | null;
    keyPointsConfirmed: boolean | null;
    minReadingTimeMet: boolean | null;
    scrollCompletionMet: boolean | null;
  };
  errors: string[];
};

export const postValidateAcknowledgment = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/policies/acknowledgment/validate`, {
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