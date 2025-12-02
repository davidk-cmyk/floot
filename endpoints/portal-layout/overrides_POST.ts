import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./overrides_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin") {
      return new Response(
        superjson.stringify({ error: "Forbidden: Admins only" }),
        { status: 403 }
      );
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Verify portal belongs to the user's organization
    const portal = await db
      .selectFrom("portals")
      .select("id")
      .where("id", "=", input.portalId)
      .where("organizationId", "=", user.organizationId)
      .executeTakeFirst();

    if (!portal) {
      return new Response(
        superjson.stringify({ error: "Portal not found or access denied" }),
        { status: 404 }
      );
    }

    const upsertData = {
      portalId: input.portalId,
      headerOverride: input.headerOverride,
      footerOverride: input.footerOverride,
      metadataOverride: input.metadataOverride,
      layoutTemplateId: input.layoutTemplateId,
    };

    const result = await db
      .insertInto("portalLayoutOverrides")
      .values(upsertData)
      .onConflict((oc) =>
        oc.column("portalId").doUpdateSet({
          ...upsertData,
          updatedAt: new Date(),
        })
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    const output: OutputType = { success: true, overrides: result };
    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating portal layout overrides:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "User not authenticated" }),
        { status: 401 }
      );
    }
    if (error instanceof ZodError) {
      return new Response(
        superjson.stringify({ error: "Invalid input", details: error.errors }),
        { status: 400 }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}