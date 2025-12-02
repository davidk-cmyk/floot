import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./update_POST.schema";
import superjson from "superjson";
import bcrypt from "bcryptjs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESERVED_PORTAL_SLUGS = ["admin", "api", "_internal", "_system"];

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: You must be an admin to update a portal." }),
        { status: 403 }
      );
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const portal = await db
      .selectFrom("portals")
      .where("id", "=", input.portalId)
      .where("organizationId", "=", user.organizationId)
      .select("id")
      .executeTakeFirst();

    if (!portal) {
      return new Response(
        superjson.stringify({ error: "Portal not found or you do not have permission to edit it." }),
        { status: 404 }
      );
    }

    if (input.slug) {
      // Check if slug is reserved
      if (RESERVED_PORTAL_SLUGS.includes(input.slug)) {
        return new Response(
          superjson.stringify({ error: `Portal slug '${input.slug}' is reserved. Please choose a different slug.` }),
          { status: 400 }
        );
      }

      const existingPortal = await db
        .selectFrom("portals")
        .where("slug", "=", input.slug)
        .where("organizationId", "=", user.organizationId)
        .where("id", "!=", input.portalId)
        .select("id")
        .orderBy("id", "desc")
        .executeTakeFirst();

      if (existingPortal) {
        return new Response(
          superjson.stringify({ error: "A portal with this slug already exists." }),
          { status: 409 }
        );
      }
    }

    let passwordHash: string | null | undefined = undefined;
    if (input.accessType === "password") {
      if (input.password && input.password.length >= 8) {
        passwordHash = await bcrypt.hash(input.password, 10);
      } else if (input.password === null) {
        // Explicitly clearing password
        passwordHash = null;
      }
    }

    const updatedPortal = await db
      .updateTable("portals")
      .set({
        name: input.name,
        slug: input.slug,
        description: input.description,
        accessType: input.accessType,
        ...(passwordHash !== undefined && { passwordHash }),
        allowedRoles: input.accessType === "role_based" ? input.allowedRoles : null,
        isActive: input.isActive,
        requiresAcknowledgment: input.requiresAcknowledgment,
        acknowledgmentDueDays: input.acknowledgmentDueDays,
        acknowledgmentReminderDays: input.acknowledgmentReminderDays,
        acknowledgmentMode: input.acknowledgmentMode,
        minimumReadingTimeSeconds: input.minimumReadingTimeSeconds,
        requireFullScroll: input.requireFullScroll,
        updatedAt: new Date(),
      })
      .where("id", "=", input.portalId)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Handle email recipients if provided
    if (input.emailRecipients !== undefined) {
      // Validate email formats
      for (const email of input.emailRecipients) {
        if (!EMAIL_REGEX.test(email)) {
          return new Response(
            superjson.stringify({ error: `Invalid email format: ${email}` }),
            { status: 400 }
          );
        }
      }

      // Delete all existing recipients for this portal
      await db
        .deleteFrom("portalEmailRecipients")
        .where("portalId", "=", input.portalId)
        .where("organizationId", "=", user.organizationId)
        .execute();

      // Insert new list if not empty
      if (input.emailRecipients.length > 0) {
        const emailValues = input.emailRecipients.map(email => ({
          portalId: input.portalId,
          email: email,
          organizationId: user.organizationId,
          createdBy: user.id,
        }));

        await db
          .insertInto("portalEmailRecipients")
          .values(emailValues)
          .execute();
      }
    }

    return new Response(superjson.stringify(updatedPortal satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating portal:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}