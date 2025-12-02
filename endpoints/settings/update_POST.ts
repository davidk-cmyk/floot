import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { toJsonb } from "../../helpers/toJsonb";
import { sql } from "kysely";
import { schema, OutputType } from "./update_POST.schema";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Settings } from "../../helpers/schema";
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({
          error: "Unauthorized: Only admins can update settings.",
        }),
        { status: 403 }
      );
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const updatedSetting = await db
      .insertInto("settings")
      .values({
        settingKey: input.settingKey,
        settingValue: toJsonb(input.settingValue),
        organizationId: user.organizationId,
      })
      .onConflict((oc) =>
        oc.columns(["settingKey", "organizationId"]).doUpdateSet({
          settingValue: toJsonb(input.settingValue),
          updatedAt: new Date(),
        })
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(
      superjson.stringify(updatedSetting satisfies Selectable<Settings>),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error updating setting:", error);
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