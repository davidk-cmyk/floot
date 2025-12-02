import { z } from "zod";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./get_POST.schema";
import superjson from "superjson";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const { user: sessionUser } = await getServerUserSession(request);

    const json = superjson.parse(await request.text());
    const { userId } = schema.parse(json);

    // Permission check: Admin, Editor, or the user themselves
    const isAllowed =
      sessionUser.role === "admin" ||
      sessionUser.role === "editor" ||
      sessionUser.id === userId;

    if (!isAllowed) {
      return new Response(
        superjson.stringify({
          error: "Forbidden",
          message: "You do not have permission to view this user's details.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const targetUser = await db
      .selectFrom("users")
      .leftJoin("oauthAccounts", "users.id", "oauthAccounts.userId")
      .select([
        "users.id",
        "users.displayName",
        "users.email",
        "users.firstName",
        "users.lastName",
        "users.avatarUrl",
        "users.role",
        "users.createdAt",
        "users.isActive",
        "oauthAccounts.provider as oauthProvider",
      ])
      .where("users.id", "=", userId)
      .where("users.organizationId", "=", sessionUser.organizationId)
      .executeTakeFirst();

    if (!targetUser) {
      return new Response(
        superjson.stringify({
          error: "Not Found",
          message: "User not found or does not belong to your organization.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const response: OutputType = { user: targetUser };

    return new Response(superjson.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to get user:", error);

    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    if (error instanceof z.ZodError) {
      return new Response(
        superjson.stringify({ error: "Invalid input", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: "Failed to fetch user",
        message: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}