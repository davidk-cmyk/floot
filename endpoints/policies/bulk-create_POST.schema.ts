import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Policies } from "../../helpers/schema";

// Schema for a single policy within the bulk request.
// It mirrors the single creation schema but without the refinements,
// as they are harder to apply on a per-item basis in a bulk array.
// Validation can be enhanced on the client-side per item.
export const singlePolicySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  content: z.string().min(10, "Content is required."),
  effectiveDate: z.coerce.date().optional(),
  expirationDate: z.coerce.date().optional(),
  reviewDate: z.coerce.date().optional(),
  tags: z.array(z.string()).optional().nullable(),
  department: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

// Main schema for the bulk creation endpoint
export const schema = z.object({
  policies: z.array(singlePolicySchema).min(1, "At least one policy is required for bulk creation."),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<Policies>[];

export const postBulkCreatePolicies = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/policies/bulk-create`, {
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
    throw new Error((errorObject as any).error || "Bulk policy creation failed");
  }
  return superjson.parse<OutputType>(await result.text());
};