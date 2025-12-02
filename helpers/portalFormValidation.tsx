import { z } from 'zod';
import { UserRoleArrayValues } from './schema';

// Create a unified form schema that works for both create and edit modes
export const portalFormSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters long."),
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters long.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug can only contain lowercase letters, numbers, and hyphens."
      ),
    description: z.string().optional(),
    accessType: z.enum(['public', 'password', 'authenticated', 'role_based']),
    password: z.string().optional(),
    allowedRoles: z.array(z.enum(UserRoleArrayValues)).optional(),
    isActive: z.boolean().optional(),
    requiresAcknowledgment: z.boolean().optional(),
    acknowledgmentMode: z.enum(['simple', 'confirmed_understanding', 'email']).optional(),
    minimumReadingTimeSeconds: z.number().int().min(0).optional(),
    requireFullScroll: z.boolean().optional(),
    acknowledgmentDueDays: z.number().int().min(1).optional(),
    acknowledgmentReminderDays: z.number().int().min(1).optional(),
    emailRecipients: z.array(z.string().email()).optional(),
  })
  .refine(
    (data) => {
      if (data.accessType === "password") {
        return !!data.password && data.password.length >= 8;
      }
      return true;
    },
    {
      message: "Password is required and must be at least 8 characters for password-protected portals.",
      path: ["password"],
    }
  )
  .refine(
    (data) => {
      if (data.accessType === "role_based") {
        return !!data.allowedRoles && data.allowedRoles.length > 0;
      }
      return true;
    },
    {
      message: "At least one role must be selected for role-based access.",
      path: ["allowedRoles"],
    }
  )
  .refine(
    (data) => {
      if (data.acknowledgmentMode === "email") {
        return !!data.emailRecipients && data.emailRecipients.length > 0;
      }
      return true;
    },
    {
      message: "At least one email recipient is required for email-based acknowledgment.",
      path: ["emailRecipients"],
    }
  );

export type PortalFormData = z.infer<typeof portalFormSchema>;