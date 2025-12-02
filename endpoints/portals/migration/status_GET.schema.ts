import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  totalPolicies: number;
  migratedPolicies: number;
  unmigratedPolicies: number;
  unmigratedPublic: number;
  unmigratedInternal: number;
};

export const getPortalsMigrationStatus = async (
  body?: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/portals/migration/status`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error((errorObject as any).error || "Request failed");
  }
  return superjson.parse<OutputType>(await result.text());
};