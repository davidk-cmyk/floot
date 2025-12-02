import { db } from '../../helpers/db';
import { schema, OutputType } from './register_POST.schema';
import superjson from 'superjson';
import { generatePasswordHash } from '../../helpers/generatePasswordHash';
import { UserRoleArrayValues } from '../../helpers/schema';
import { DEFAULT_POLICY_CATEGORIES, DEFAULT_DEPARTMENTS, DEFAULT_POLICY_TAGS } from '../../helpers/defaultPolicySettings';
import { toJsonb } from '../../helpers/toJsonb';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const {
      organizationName,
      organizationSlug,
      domain,
      adminDisplayName,
      adminEmail,
      adminPassword,
    } = input;

    // Transaction to ensure atomicity
    const newOrganization = await db.transaction().execute(async (trx) => {
      // 1. Check if organization slug or email is already in use
      const existingOrg = await trx
        .selectFrom('organizations')
        .select('id')
        .where('slug', '=', organizationSlug)
        .executeTakeFirst();

      if (existingOrg) {
        throw new Error('This organization URL is already taken.');
      }

      const existingUser = await trx
        .selectFrom('users')
        .select('id')
        .where('email', '=', adminEmail)
        .executeTakeFirst();

      if (existingUser) {
        throw new Error('This email address is already in use.');
      }

      // 2. Create the organization
      const org = await trx
        .insertInto('organizations')
        .values({
          name: organizationName,
          slug: organizationSlug,
          domain: domain || null,
          isActive: true,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // 3. Hash the admin's password
      const passwordHash = await generatePasswordHash(adminPassword);

      // 4. Create the admin user
      const adminUser = await trx
        .insertInto('users')
        .values({
          displayName: adminDisplayName,
          email: adminEmail,
          role: 'admin',
          organizationId: org.id,
          isActive: true,
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      // 5. Store the password hash
      await trx
        .insertInto('userPasswords')
        .values({
          userId: adminUser.id,
          passwordHash: passwordHash,
        })
        .execute();

      // 6. Create default portals
      await trx
        .insertInto('portals')
        .values([
          {
            organizationId: org.id,
            name: 'Public Portal',
            slug: 'public',
            accessType: 'public',
            isActive: true,
            description: 'Default public portal for sharing policies externally.',
          },
          {
            organizationId: org.id,
            name: 'Internal Portal',
            slug: 'internal',
            accessType: 'authenticated',
            isActive: true,
            description: 'Default internal portal for organization members.',
          },
        ])
        .execute();

      // 7. Set up default policy settings
      await trx
        .insertInto('settings')
        .values([
          {
            organizationId: org.id,
            settingKey: 'policy.categories',
            settingValue: toJsonb(DEFAULT_POLICY_CATEGORIES),
          },
          {
            organizationId: org.id,
            settingKey: 'policy.departments', 
            settingValue: toJsonb(DEFAULT_DEPARTMENTS),
          },
          {
            organizationId: org.id,
            settingKey: 'policy.tags',
            settingValue: toJsonb(DEFAULT_POLICY_TAGS),
          },
        ])
        .execute();

      return org;
    });

    const response: OutputType = { organizationSlug: newOrganization.slug };

    return new Response(superjson.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to register organization:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      superjson.stringify({
        message: errorMessage,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
}