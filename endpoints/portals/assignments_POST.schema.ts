import { z } from "zod";
import superjson from "superjson";

export const assignmentActionSchema = z.object({
  policyId: z.number().int().positive(),
  action: z.enum(["add", "remove"]),
});

export const schema = z.object({
  portalId: z.number().int().positive(),
  assignments: z.array(assignmentActionSchema),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  message: string;
  addedCount: number;
  removedCount: number;
};

export const postPortalAssignments = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/portals/assignments`, {
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