import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { OutputType } from "./list_GET.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "admin" && user.role !== "editor") {
      return new Response(
        superjson.stringify({
          error: "Forbidden",
          message: "You do not have permission to access this resource.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const users = await db
      .selectFrom("users")
      .select([
        "id", 
        "email", 
        "displayName", 
        "firstName", 
        "lastName", 
        "role", 
        "createdAt", 
        "isActive", 
        "hasLoggedIn"
      ])
      .where("organizationId", "=", user.organizationId)
      .orderBy("displayName", "asc")
      .execute();

    const response: OutputType = { users };

    return new Response(superjson.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to list users:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: "Failed to fetch users",
        message: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}