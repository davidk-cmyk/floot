import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { OutputType } from "./settings_GET.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { supportedFormats } from "../../../helpers/policyDownloadConstants";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    let settings = await db
      .selectFrom("organizationDownloadSettings")
      .selectAll()
      .where("organizationId", "=", user.organizationId)
      .executeTakeFirst();

    // Fetch layout template information if layoutTemplateId exists
    let layoutTemplate = null;
    if (settings?.layoutTemplateId) {
      layoutTemplate = await db
        .selectFrom("layoutTemplates")
        .selectAll()
        .where("id", "=", settings.layoutTemplateId)
        .executeTakeFirst();
    }

    if (!settings) {
      // Provide a default structure if no settings exist yet
      settings = {
        id: 0,
        organizationId: user.organizationId,
        enabledFormats: JSON.stringify(supportedFormats),
        headerTemplate: "",
        footerTemplate: "",
        brandingEnabled: true,
        includeToc: false,
        maxFileSizeMb: 50,
        rateLimitPerMinute: 10,
        dateFormat: "YYYY-MM-DD",
        pageNumberFormat: "Page {current} of {total}",
        showMetadata: true,
        layoutTemplateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const output: OutputType = {
      ...settings,
      // Ensure enabledFormats is parsed from JSON for the client
      enabledFormats:
        typeof settings.enabledFormats === "string"
          ? JSON.parse(settings.enabledFormats)
          : settings.enabledFormats ?? [],
      // Include layout template information if available
      layoutTemplate: layoutTemplate || undefined,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching download settings:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "User not authenticated" }),
        { status: 401 }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}