import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./getMany_GET.schema";
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
    const settingKeys = url.searchParams.getAll("settingKeys");
    const organizationIdParam = url.searchParams.get("organizationId");

    const input = schema.parse({ 
      settingKeys,
      organizationId: organizationIdParam ? Number(organizationIdParam) : undefined,
    });

    // Check if all settings are branding settings
    const allBrandingSettings = input.settingKeys.every(key => key.startsWith("branding."));

    // Determine if we can proceed with the query
    if (allBrandingSettings && input.organizationId) {
      // All branding with explicit organizationId - allow public access
      const settings = await db
        .selectFrom("settings")
        .where("settingKey", "in", input.settingKeys)
        .where("organizationId", "=", input.organizationId)
        .selectAll()
        .execute();

      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.settingKey] = setting;
        return acc;
      }, {} as Record<string, (typeof settings)[0]>);

      const result: OutputType = {};
      for (const key of input.settingKeys) {
        result[key] = settingsMap[key] ?? null;
      }

      return new Response(superjson.stringify(result), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } else if (user) {
      // User is authenticated - use their organization
      const settings = await db
        .selectFrom("settings")
        .where("settingKey", "in", input.settingKeys)
        .where("organizationId", "=", user.organizationId)
        .selectAll()
        .execute();

      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.settingKey] = setting;
        return acc;
      }, {} as Record<string, (typeof settings)[0]>);

      const result: OutputType = {};
      for (const key of input.settingKeys) {
        result[key] = settingsMap[key] ?? null;
      }

      return new Response(superjson.stringify(result), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // No auth, no org - return empty object
      const result: OutputType = {};
      for (const key of input.settingKeys) {
        result[key] = null;
      }

      return new Response(superjson.stringify(result), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("Error getting many settings:", error);
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
      headers: { "Content-Type": "application/json" },
    });
  }
}