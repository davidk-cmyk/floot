import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./update_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { ZodError } from "zod";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric characters
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-") // remove consecutive hyphens
    .slice(0, 50);
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (!user) {
      throw new NotAuthenticatedError();
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Authorization: Only an admin of the organization can update it.
    if (user.role !== "admin" || user.organizationId !== input.organizationId) {
      return new Response(
        superjson.stringify({
          error: "Forbidden",
          message: "You do not have permission to update this organization.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const updateData: {
      name?: string;
      slug?: string;
      domain?: string | null;
      isActive?: boolean;
    } = {};

    if (input.name) {
      updateData.name = input.name;
      // If name is updated and slug is not, regenerate slug
      if (!input.slug) {
        updateData.slug = generateSlug(input.name);
      }
    }

    if (input.slug) {
      updateData.slug = input.slug;
    }

    // If slug is being updated (either directly or via name change), check for uniqueness
    if (updateData.slug) {
      const existingOrg = await db
        .selectFrom("organizations")
        .select("id")
        .where("slug", "=", updateData.slug)
        .where("id", "!=", input.organizationId)
        .executeTakeFirst();

      if (existingOrg) {
        return new Response(
          superjson.stringify({
            error: "Conflict",
            message: "This slug is already in use by another organization.",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (typeof input.domain !== "undefined") {
      updateData.domain = input.domain;
    }

    if (typeof input.isActive === "boolean") {
      updateData.isActive = input.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        superjson.stringify({
          error: "Bad Request",
          message: "No fields to update were provided.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const updatedOrganization = await db
      .updateTable("organizations")
      .set(updateData)
      .where("id", "=", input.organizationId)
      .returningAll()
      .executeTakeFirstOrThrow();

    const response: OutputType = { organization: updatedOrganization };

    return new Response(superjson.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to update organization:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    if (error instanceof ZodError) {
      return new Response(
        superjson.stringify({
          error: "Validation failed",
          message: error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: "Failed to update organization",
        message: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}