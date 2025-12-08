import { z } from 'zod';
import superjson from 'superjson';

export const schema = z.object({
  organizationName: z.string().min(1, 'Organization name is required.'),
  organizationSlug: z
    .string()
    .min(3, 'URL slug must be at least 3 characters.')
    .regex(/^[a-z0-9-]+$/, 'URL slug can only contain lowercase letters, numbers, and hyphens.'),
  domain: z.string().optional(),
  adminDisplayName: z.string().min(1, 'Your name is required.'),
  adminEmail: z.string().email('A valid email is required.'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters.'),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  organizationSlug: string;
};

export const postRegisterOrganization = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/organizations/register`, {
    method: 'POST',
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const responseText = await result.text();
    let errorMessage = 'Failed to create organization';
    try {
      const errorObject = superjson.parse<{ message?: string }>(responseText);
      if (errorObject.message) {
        errorMessage = errorObject.message;
      }
    } catch {
      // If superjson parsing fails, try regular JSON
      try {
        const plainError = JSON.parse(responseText);
        if (plainError.message) {
          errorMessage = plainError.message;
        }
      } catch {
        // Keep default error message
      }
    }
    throw new Error(errorMessage);
  }

  return superjson.parse<OutputType>(await result.text());
};