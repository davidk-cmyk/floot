import { db } from "../../helpers/db";
import { schema, OutputType } from "./lookup_GET.schema";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Portals } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response(
        superjson.stringify({ error: "Portal slug is required" }),
        { status: 400 }
      );
    }

    const validationResult = schema.safeParse({ slug });
    if (!validationResult.success) {
      return new Response(
        superjson.stringify({ error: validationResult.error.message }),
        { status: 400 }
      );
    }

    const portal = await db
      .selectFrom("portals")
      .select(["id", "slug", "name", "organizationId"])
      .where("slug", "=", slug)
      .executeTakeFirst();

    if (!portal) {
      return new Response(
        superjson.stringify({ error: "Portal not found" }),
        { status: 404 }
      );
    }

    const output: OutputType = {
      id: portal.id,
      slug: portal.slug,
      name: portal.name,
      organizationId: portal.organizationId,
    };

    return new Response(superjson.stringify(output));
  } catch (error) {
    console.error("Portal lookup error:", error);
    return new Response(
      superjson.stringify({
        error:
          error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 }
    );
  }
}