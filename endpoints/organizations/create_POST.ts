import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./create_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { 
  DEFAULT_POLICY_CATEGORIES, 
  DEFAULT_DEPARTMENTS, 
  DEFAULT_POLICY_TAGS 
} from "../../helpers/defaultPolicySettings";
import { toJsonb } from "../../helpers/toJsonb";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric characters
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-") // remove consecutive hyphens
    .slice(0, 50);
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({
          error: "Forbidden",
          message: "You do not have permission to create an organization.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const slug = generateSlug(input.name);

    // Use a transaction to ensure atomicity
    const result = await db.transaction().execute(async (trx) => {
      // Create the organization
      const newOrganization = await trx
        .insertInto("organizations")
        .values({
          name: input.name,
          slug: slug,
          domain: input.domain || null,
          isActive: true,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      console.log("Created new organization:", newOrganization.id, newOrganization.name);

      // Create default portals
      await trx
        .insertInto("portals")
        .values([
          {
            organizationId: newOrganization.id,
            name: "Public Portal",
            slug: "public",
            accessType: "public",
            isActive: true,
            description: "Default public portal for sharing policies externally.",
          },
          {
            organizationId: newOrganization.id,
            name: "Internal Portal",
            slug: "internal",
            accessType: "authenticated",
            isActive: true,
            description: "Default internal portal for organization members.",
          },
        ])
        .execute();

      console.log("Created default portals for organization:", newOrganization.id);

      // Create default policy settings
      const settingsToCreate = [
        {
          settingKey: "policy.categories",
          settingValue: toJsonb(DEFAULT_POLICY_CATEGORIES),
          organizationId: newOrganization.id,
        },
        {
          settingKey: "policy.departments", 
          settingValue: toJsonb(DEFAULT_DEPARTMENTS),
          organizationId: newOrganization.id,
        },
        {
          settingKey: "policy.tags",
          settingValue: toJsonb(DEFAULT_POLICY_TAGS),
          organizationId: newOrganization.id,
        },
      ];

      // Insert all settings
      await trx
        .insertInto("settings")
        .values(settingsToCreate)
        .execute();

      console.log("Created default policy settings for organization:", newOrganization.id);

      return newOrganization;
    });

    const response: OutputType = { organization: result };

    return new Response(superjson.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to create organization:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: "Failed to create organization",
        message: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}