import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { schema, OutputType, DOCUMENT_LAYOUT_SETTING_KEY, defaultDocumentLayoutSettings } from "./document-layout_GET.schema";
import superjson from "superjson";
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    const url = new URL(request.url);
    const portalIdParam = url.searchParams.get("portalId");
    const portalId = portalIdParam ? parseInt(portalIdParam, 10) : undefined;

    const input = schema.parse({ portalId });

    let layoutSettings: OutputType | null = null;

    if (input.portalId) {
      // First, try to get portal-specific settings
      const portalSetting = await db.
      selectFrom("portalSettings").
      where("portalId", "=", input.portalId).
      where("settingKey", "=", DOCUMENT_LAYOUT_SETTING_KEY).
      select("settingValue").
      executeTakeFirst();

      if (portalSetting?.settingValue) {
        // Defensive parsing: settingValue might be a JSON string or already parsed
        const value = portalSetting.settingValue;
        layoutSettings = typeof value === 'string' ? JSON.parse(value) : value;
      }
    }

    // If no portal-specific settings are found, or if no portalId was provided,
    // fall back to organization-level settings.
    if (!layoutSettings) {
      const orgSetting = await db.
      selectFrom("settings").
      where("organizationId", "=", user.organizationId).
      where("settingKey", "=", DOCUMENT_LAYOUT_SETTING_KEY).
      select("settingValue").
      executeTakeFirst();

      if (orgSetting?.settingValue) {
        // Defensive parsing: settingValue might be a JSON string or already parsed
        const value = orgSetting.settingValue;
        layoutSettings = typeof value === 'string' ? JSON.parse(value) : value;
      }
    }

    // If no settings are found at either level, return the system defaults.
    const finalSettings = layoutSettings ? { ...defaultDocumentLayoutSettings, ...layoutSettings } : defaultDocumentLayoutSettings;

    return new Response(superjson.stringify(finalSettings), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error("Error getting document layout settings:", error);
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
      headers: { "Content-Type": "application/json" }
    });
  }
}