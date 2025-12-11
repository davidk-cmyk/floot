import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  policyIds: z.array(z.number().int().positive()).min(1, "At least one policy is required"),
  portalIds: z.array(z.number().int().positive()).min(1, "At least one portal is required"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
  assignedCount: number;
};

export const bulkAssignPoliciesToPortals = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/policies/bulk-assign-portals`, {
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
