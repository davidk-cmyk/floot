import { db } from '../../helpers/db';
import { schema, OutputType } from './get_by_slug_GET.schema';

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    
    if (!slug) {
      return Response.json(
        { message: 'Organization slug is required' },
        { status: 400 }
      );
    }

    const { slug: validatedSlug } = schema.parse({ slug });

    const organization = await db
      .selectFrom('organizations')
      .select(['id', 'name', 'slug', 'domain', 'isActive'])
      .where('slug', '=', validatedSlug)
      .where('isActive', '=', true)
      .executeTakeFirst();

    if (!organization) {
      return Response.json(
        { message: 'Organization not found' },
        { status: 404 }
      );
    }

    const response: OutputType = {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      domain: organization.domain,
      isActive: organization.isActive ?? true,
    };

    return Response.json(response);
  } catch (error) {
    console.error('Failed to fetch organization:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return Response.json(
      { message: errorMessage },
      { status: 400 }
    );
  }
}