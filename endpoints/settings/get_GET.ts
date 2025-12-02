import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./get_GET.schema";
import superjson from "superjson";
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    // Try to get user session, but don't fail if not authenticated for public settings
    let user = null;
    try {
      const session = await getServerUserSession(request);
      user = session.user;
    } catch (error) {
      // User is not authenticated, continue with public access
    }

    const url = new URL(request.url);
    const settingKey = url.searchParams.get("settingKey");
    const organizationIdParam = url.searchParams.get("organizationId");

    const input = schema.parse({ 
      settingKey,
      organizationId: organizationIdParam ? Number(organizationIdParam) : undefined,
    });

    const isBrandingSetting = input.settingKey.startsWith("branding.");

    // Determine if we can proceed with the query
    if (isBrandingSetting && input.organizationId) {
      // Branding with explicit organizationId - allow public access
      const setting = await db
        .selectFrom("settings")
        .where("settingKey", "=", input.settingKey)
        .where("organizationId", "=", input.organizationId)
        .selectAll()
        .executeTakeFirst();

      return new Response(superjson.stringify(setting ?? null), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } else if (!isBrandingSetting && user) {
      // Non-branding settings require auth and use user's org
      const setting = await db
        .selectFrom("settings")
        .where("settingKey", "=", input.settingKey)
        .where("organizationId", "=", user.organizationId)
        .selectAll()
        .executeTakeFirst();

      return new Response(superjson.stringify(setting ?? null), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } else if (!user && !input.organizationId) {
      // No auth, no org - cannot fetch
      return new Response(superjson.stringify(null), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } else if (isBrandingSetting && !input.organizationId && user) {
      // Branding setting with authenticated user but no explicit organizationId
      const setting = await db
        .selectFrom("settings")
        .where("settingKey", "=", input.settingKey)
        .where("organizationId", "=", user.organizationId)
        .selectAll()
        .executeTakeFirst();

      return new Response(superjson.stringify(setting ?? null), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Edge case: non-branding without user (shouldn't happen but handle it)
      return new Response(superjson.stringify(null), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("Error getting setting:", error);
    let errorMessage = "An unexpected error occurred";
    let statusCode = 500;

    if (error instanceof ZodError) {
      errorMessage = error.errors.map((e) => e.message).join(", ");
      statusCode = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(superjson.stringify({ error: errorMessage }), {
      status: statusCode,
    });
  }
}