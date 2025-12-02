import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./settings_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    // Authorization: Only admins can update settings
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "You are not authorized to perform this action." }),
        { status: 403 }
      );
    }

    const json = superjson.parse(await request.text());
    const validatedSettings = schema.parse(json);

    // Validate layoutTemplateId exists if provided
    if (validatedSettings.layoutTemplateId) {
      const layoutTemplate = await db
        .selectFrom("layoutTemplates")
        .select("id")
        .where("id", "=", validatedSettings.layoutTemplateId)
        .executeTakeFirst();
      
      if (!layoutTemplate) {
        return new Response(
          superjson.stringify({ error: "Invalid layout template ID" }),
          { status: 400 }
        );
      }
    }

    const dataToUpsert = {
      ...validatedSettings,
      organizationId: user.organizationId,
      enabledFormats: JSON.stringify(validatedSettings.enabledFormats),
      // Set defaults for new fields if not provided
      dateFormat: validatedSettings.dateFormat ?? "YYYY-MM-DD",
      pageNumberFormat: validatedSettings.pageNumberFormat ?? "Page {current} of {total}",
      showMetadata: validatedSettings.showMetadata ?? true,
      updatedAt: new Date(),
    };

    const result = await db
      .insertInto("organizationDownloadSettings")
      .values(dataToUpsert)
      .onConflict((oc) =>
        oc
          .column("organizationId")
          .doUpdateSet(dataToUpsert)
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    // Fetch layout template information if layoutTemplateId exists
    let layoutTemplate = null;
    if (result.layoutTemplateId) {
      layoutTemplate = await db
        .selectFrom("layoutTemplates")
        .selectAll()
        .where("id", "=", result.layoutTemplateId)
        .executeTakeFirst();
    }

    const output: OutputType = {
      ...result,
      enabledFormats: JSON.parse(result.enabledFormats as string),
      layoutTemplate: layoutTemplate || undefined,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating download settings:", error);
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