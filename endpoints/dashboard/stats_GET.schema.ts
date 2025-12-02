import { z } from "zod";
import superjson from "superjson";

// No input schema needed for a simple GET request
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  totalPolicies: number;
  pendingApprovals: number;
  acknowledgmentRate: number; // as a percentage
  pendingReminders: number;
  overdueAssignments: number;
  requiresAcknowledgement: number;
};

export const getDashboardStats = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/dashboard/stats`, {
    method: "GET",
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