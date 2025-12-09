import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Portals, UserRoleArrayValues } from "../../helpers/schema";
import { PortalAccessTypeSchema } from "./list_GET.schema";

export const schema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters long."),
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters long.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug can only contain lowercase letters, numbers, and hyphens."
      ),
    label: z.string().max(100, "Label must be at most 100 characters.").optional(),
    description: z.string().optional(),
    accessType: PortalAccessTypeSchema,
    password: z.string().optional(),
    allowedRoles: z.array(z.enum(UserRoleArrayValues)).optional(),
    isActive: z.boolean().optional(),
    requiresAcknowledgment: z.boolean().optional(),
    acknowledgmentDueDays: z.number().int().min(1).optional(),
    acknowledgmentReminderDays: z.number().int().min(1).optional(),
    acknowledgmentMode: z.enum(["simple", "confirmed_understanding", "email"]).optional(),
    minimumReadingTimeSeconds: z.number().int().min(0).optional(),
    requireFullScroll: z.boolean().optional(),
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
  );

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Portals>;

export const postCreatePortal = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/portals/create`, {
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