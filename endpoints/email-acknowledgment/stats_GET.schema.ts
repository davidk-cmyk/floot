import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  totalPortalsWithEmailTracking: number;
  totalExpectedAcknowledgments: number;
  totalAcknowledged: number;
  acknowledgmentRate: number;
  breakdownByPortal: {
    portalId: number;
    portalName: string;
    expectedCount: number;
    acknowledgedCount: number;
    completionRate: number;
  }[];
};

export const getEmailAcknowledgmentStats = async (
  params: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/email-acknowledgment/stats`, {
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