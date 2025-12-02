import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./overrides_GET.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const url = new URL(request.url);
    const portalId = url.searchParams.get("portalId");

    const { portalId: validatedPortalId } = schema.parse({
      portalId: portalId ? parseInt(portalId, 10) : undefined,
    });

    // Verify portal belongs to the user's organization
    const portal = await db
      .selectFrom("portals")
      .select("id")
      .where("id", "=", validatedPortalId)
      .where("organizationId", "=", user.organizationId)
      .executeTakeFirst();

    if (!portal) {
      return new Response(
        superjson.stringify({ error: "Portal not found or access denied" }),
        { status: 404 }
      );
    }

    let overrides = await db
      .selectFrom("portalLayoutOverrides")
      .selectAll()
      .where("portalId", "=", validatedPortalId)
      .executeTakeFirst();

    if (!overrides) {
      // Return a default structure if no overrides exist
      overrides = {
        id: 0,
        portalId: validatedPortalId,
        headerOverride: null,
        footerOverride: null,
        metadataOverride: null,
        layoutTemplateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const output: OutputType = overrides;

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching portal layout overrides:", error);
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