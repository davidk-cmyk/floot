import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Policies } from "../../helpers/schema";

// All fields are optional for updates
export const schema = z.object({
  policyId: z.number().int(),
  title: z.string().min(3, "Title must be at least 3 characters long.").optional(),
  content: z.string().min(10, "Content is required.").optional(),
  status: z.string().optional(),
  effectiveDate: z.coerce.date().optional().nullable(),
  expirationDate: z.coerce.date().optional().nullable(),
  publishedAt: z.coerce.date().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  department: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  reviewDate: z.coerce.date().optional().nullable(),
  portalIds: z.array(z.number().int().positive()).optional().nullable(),
  changeSummary: z.string().optional(),
}).refine((data) => {
  // Validate that review date is not earlier than effective date
  if (data.reviewDate && data.effectiveDate) {
    return data.reviewDate >= data.effectiveDate;
  }
  return true;
}, {
  message: "Review date cannot be earlier than the effective date",
  path: ["reviewDate"],
}).refine((data) => {
  // Validate that review date is not earlier than expiration date
  if (data.reviewDate && data.expirationDate) {
    return data.reviewDate >= data.expirationDate;
  }
  return true;
}, {
  message: "Review date cannot be earlier than the expiration date",
  path: ["reviewDate"],
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<Policies> & {
  portalUrls?: string[];
};

export const postUpdatePolicy = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/policies/update`, {
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