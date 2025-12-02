import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { toJsonb } from '../helpers/toJsonb';
import { schema, OutputType, DOCUMENT_LAYOUT_SETTING_KEY } from "./document-layout_POST.schema";
import superjson from "superjson";
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({
          error: "Unauthorized: Only admins can update document layout settings."
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    const { portalId, ...settingsValue } = input;

    let savedSettings: OutputType;

    if (portalId) {
      // Update or insert portal-specific settings
      const portal = await db.selectFrom('portals').
      where('id', '=', portalId).
      where('organizationId', '=', user.organizationId).
      select('id').
      executeTakeFirst();

      if (!portal) {
        return new Response(
          superjson.stringify({ error: "Portal not found or does not belong to this organization." }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await db.
      insertInto("portalSettings").
      values({
        portalId: portalId,
        settingKey: DOCUMENT_LAYOUT_SETTING_KEY,
        settingValue: toJsonb(settingsValue)
      }).
      onConflict((oc) =>
      oc.columns(["portalId", "settingKey"]).doUpdateSet({
        settingValue: toJsonb(settingsValue),
        updatedAt: new Date()
      })
      ).
      returningAll().
      executeTakeFirstOrThrow();

      // Defensive parsing: settingValue might be a JSON string or already parsed
      const parsedValue = typeof result.settingValue === 'string' 
        ? JSON.parse(result.settingValue) 
        : result.settingValue;
      savedSettings = { portalId: result.portalId, ...parsedValue } as OutputType;

    } else {
      // Update or insert organization-level settings
      const result = await db.
      insertInto("settings").
      values({
        organizationId: user.organizationId,
        settingKey: DOCUMENT_LAYOUT_SETTING_KEY,
        settingValue: toJsonb(settingsValue)
      }).
      onConflict((oc) =>
      oc.columns(["organizationId", "settingKey"]).doUpdateSet({
        settingValue: toJsonb(settingsValue),
        updatedAt: new Date()
      })
      ).
      returningAll().
      executeTakeFirstOrThrow();

      // Defensive parsing: settingValue might be a JSON string or already parsed
      const parsedValue = typeof result.settingValue === 'string' 
        ? JSON.parse(result.settingValue) 
        : result.settingValue;
      savedSettings = { portalId: undefined, ...parsedValue } as OutputType;
    }

    return new Response(superjson.stringify(savedSettings), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error("Error updating document layout settings:", error);
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