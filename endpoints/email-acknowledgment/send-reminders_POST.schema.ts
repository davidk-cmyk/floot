import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  reminders: z.array(
    z.object({
      email: z.string().email(),
      policyId: z.number(),
      portalId: z.number(),
    })
  ),
  customMessage: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  sent: number;
  failed: number;
  errors: string[];
};

export const sendReminders = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/email-acknowledgment/send-reminders`, {
    method: "POST",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: superjson.stringify(params),
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any).error || "An unknown error occurred");
  }
  return superjson.parse<OutputType>(await result.text());
};
