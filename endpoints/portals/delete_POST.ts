import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./delete_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: You must be an admin to delete a portal." }),
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
        superjson.stringify({ error: "Portal not found or you do not have permission to delete it." }),
        { status: 404 }
      );
    }

    // Transaction to ensure atomicity
    await db.transaction().execute(async (trx) => {
      // Delete all policy assignments for this portal
      await trx
        .deleteFrom("policyPortalAssignments")
        .where("portalId", "=", input.portalId)
        .execute();
      
      // Delete the portal itself
      await trx
        .deleteFrom("portals")
        .where("id", "=", input.portalId)
        .execute();
    });

    const output: OutputType = { success: true, message: "Portal deleted successfully." };
    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting portal:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}