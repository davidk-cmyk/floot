import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./create_POST.schema";
import superjson from "superjson";
import bcrypt from "bcryptjs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESERVED_PORTAL_SLUGS = ["admin", "api", "_internal", "_system"];

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: You must be an admin to create a portal." }),
        { status: 403 }
      );
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Check if slug is reserved
    if (RESERVED_PORTAL_SLUGS.includes(input.slug)) {
      return new Response(
        superjson.stringify({ error: `Portal slug '${input.slug}' is reserved. Please choose a different slug.` }),
        { status: 400 }
      );
    }

    // Check if slug is unique for the organization
    const existingPortal = await db
      .selectFrom("portals")
      .where("slug", "=", input.slug)
      .where("organizationId", "=", user.organizationId)
      .select("id")
      .orderBy("id", "desc")
      .executeTakeFirst();

    if (existingPortal) {
      return new Response(
        superjson.stringify({ error: "A portal with this slug already exists." }),
        { status: 400 }
      );
    }

    let passwordHash: string | null = null;
    if (input.accessType === "password") {
      if (!input.password || input.password.length < 8) {
        return new Response(
          superjson.stringify({ error: "Password must be at least 8 characters long." }),
          { status: 400 }
        );
      }
      passwordHash = await bcrypt.hash(input.password, 10);
    }

    const newPortal = await db
      .insertInto("portals")
      .values({
        organizationId: user.organizationId,
        name: input.name,
        slug: input.slug,
        label: input.label ?? null,
        description: input.description,
        accessType: input.accessType,
        passwordHash: passwordHash,
        allowedRoles: input.accessType === "role_based" ? input.allowedRoles : null,
        isActive: input.isActive ?? true,
        requiresAcknowledgment: input.requiresAcknowledgment ?? false,
        acknowledgmentDueDays: input.acknowledgmentDueDays ?? null,
        acknowledgmentReminderDays: input.acknowledgmentReminderDays ?? null,
        acknowledgmentMode: input.acknowledgmentMode ?? "simple",
        minimumReadingTimeSeconds: input.minimumReadingTimeSeconds ?? 0,
        requireFullScroll: input.requireFullScroll ?? false,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Handle email recipients if provided
    if (input.emailRecipients && input.emailRecipients.length > 0) {
      // Validate email formats
      for (const email of input.emailRecipients) {
        if (!EMAIL_REGEX.test(email)) {
          return new Response(
            superjson.stringify({ error: `Invalid email format: ${email}` }),
            { status: 400 }
          );
        }
      }

      // Insert email recipients
      const emailValues = input.emailRecipients.map(email => ({
        portalId: newPortal.id,
        email: email,
        organizationId: user.organizationId,
        createdBy: user.id,
      }));

      await db
        .insertInto("portalEmailRecipients")
        .values(emailValues)
        .execute();
    }

    return new Response(superjson.stringify(newPortal satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    console.error("Error creating portal:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}