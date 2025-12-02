import { z } from 'zod';

/**
 * A unified Zod schema that works for both creating and updating policies.
 * This schema centralizes validation logic, ensuring consistency across the application.
 */
export const universalPolicyFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  content: z.string().min(10, "Content is required."),
  
  // Status is relevant for updates, but new policies default to 'draft' on the backend.
  // Including it here allows the form to manage it universally.
  status: z.string().default('draft'),

  effectiveDate: z.coerce.date().optional(),
  expirationDate: z.coerce.date().optional(),
  reviewDate: z.coerce.date().optional(),
  
  tags: z.array(z.string()).optional().default([]),
  department: z.string().optional().default(''),
  category: z.string().optional().default(''),
  
  // Change summary is only used for updates but is included here as optional.
  changeSummary: z.string().optional().refine(
    (val) => !val || val.length >= 10,
    "Change summary must be at least 10 characters long when provided."
  ),
  
  requiresAcknowledgment: z.boolean().default(false),
  acknowledgmentMode: z.enum(['simple', 'quiz']).optional(),
  portalIds: z.array(z.number()).optional().default([]),
}).refine((data) => {
  // Validate that expiration date is not earlier than effective date
  if (data.expirationDate && data.effectiveDate) {
    return data.expirationDate >= data.effectiveDate;
  }
  return true;
}, {
  message: "Expiration date cannot be earlier than the effective date.",
  path: ["expirationDate"],
}).refine((data) => {
  // Validate that review date is not earlier than effective date
  if (data.reviewDate && data.effectiveDate) {
    return data.reviewDate >= data.effectiveDate;
  }
  return true;
}, {
  message: "Review date cannot be earlier than the effective date.",
  path: ["reviewDate"],
});

/**
 * TypeScript type inferred from the universalPolicyFormSchema.
 * Represents the structure of the form's values for both create and edit modes.
 */
export type UniversalPolicyFormValues = z.infer<typeof universalPolicyFormSchema>;