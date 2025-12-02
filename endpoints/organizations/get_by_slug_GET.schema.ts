import { z } from 'zod';

export const schema = z.object({
  slug: z.string().min(1, 'Organization slug is required'),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  isActive: boolean;
};

export const getOrganizationBySlug = async (
  params: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(params);
  const result = await fetch(`/_api/organizations/get_by_slug?slug=${encodeURIComponent(validatedInput.slug)}`, {
    method: 'GET',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = await result.json().catch(() => ({ message: 'Organization not found' }));
    throw new Error(errorObject.message || 'Failed to fetch organization');
  }

  return result.json();
};