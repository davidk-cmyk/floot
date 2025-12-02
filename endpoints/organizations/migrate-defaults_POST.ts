import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import {
  DEFAULT_POLICY_CATEGORIES,
  DEFAULT_DEPARTMENTS,
  DEFAULT_POLICY_TAGS,
} from "../../helpers/defaultPolicySettings";
import { toJsonb } from "../../helpers/toJsonb";
import { OutputType } from "./migrate-defaults_POST.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({
          error: "Forbidden",
          message: "You do not have permission to perform this action.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const organizations = await db
      .selectFrom("organizations")
      .select(["id", "name"])
      .execute();

    let processedOrganizations = 0;
    let updatedOrganizations = 0;
    const migrationDetails: { organizationName: string; settingsAdded: string[] }[] = [];

    for (const org of organizations) {
      processedOrganizations++;
      let wasUpdated = false;
      const settingsAdded: string[] = [];

      await db.transaction().execute(async (trx) => {
        const existingSettings = await trx
          .selectFrom("settings")
          .where("organizationId", "=", org.id)
          .where("settingKey", "in", [
            "policy_categories",
            "policy_departments",
            "policy_tags",
          ])
          .select("settingKey")
          .execute();

        const existingKeys = new Set(
          existingSettings.map((s) => s.settingKey)
        );

        if (!existingKeys.has("policy_categories")) {
          await trx
            .insertInto("settings")
            .values({
              organizationId: org.id,
              settingKey: "policy_categories",
              settingValue: toJsonb(DEFAULT_POLICY_CATEGORIES),
              description: "Default policy categories for the organization.",
            })
            .execute();
          wasUpdated = true;
          settingsAdded.push("policy_categories");
        }

        if (!existingKeys.has("policy_departments")) {
          await trx
            .insertInto("settings")
            .values({
              organizationId: org.id,
              settingKey: "policy_departments",
              settingValue: toJsonb(DEFAULT_DEPARTMENTS),
              description: "Default departments for the organization.",
            })
            .execute();
          wasUpdated = true;
          settingsAdded.push("policy_departments");
        }

        if (!existingKeys.has("policy_tags")) {
          await trx
            .insertInto("settings")
            .values({
              organizationId: org.id,
              settingKey: "policy_tags",
              settingValue: toJsonb(DEFAULT_POLICY_TAGS),
              description: "Default policy tags for the organization.",
            })
            .execute();
          wasUpdated = true;
          settingsAdded.push("policy_tags");
        }
      });

      if (wasUpdated) {
        updatedOrganizations++;
        migrationDetails.push({ organizationName: org.name, settingsAdded });
      }
    }

    const response: OutputType = {
      success: true,
      message: `Migration completed. ${updatedOrganizations} of ${processedOrganizations} organizations were updated with default settings.`,
      processedOrganizations,
      updatedOrganizations,
      migrationDetails,
    };

    return new Response(superjson.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error migrating default settings:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: "Migration Failed", message: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}