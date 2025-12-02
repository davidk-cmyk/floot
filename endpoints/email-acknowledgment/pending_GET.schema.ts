import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  email: string;
  policyTitle: string;
  policyId: number;
  portalName: string;
  portalId: number;
  organizationId: number;
}[];

export const getPendingEmailAcknowledgments = async (
  params: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/email-acknowledgment/pending`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any).error || "An unknown error occurred");
  }
  return superjson.parse<OutputType>(await result.text());
};