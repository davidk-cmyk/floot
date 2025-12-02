import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  migratedToPublic: number;
  migratedToInternal: number;
  publicPortalCreated: boolean;
  internalPortalCreated: boolean;
  message: string;
};

export const postPortalsMigrationStart = async (
  body?: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body ?? {});
  const result = await fetch(`/_api/portals/migration/start`, {
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
    throw new Error((errorObject as any).error || "Request failed");
  }
  return superjson.parse<OutputType>(await result.text());
};