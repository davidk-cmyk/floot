import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./update-role_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user: adminUser } = await getServerUserSession(request);

    if (adminUser.role !== "admin") {
      return new Response(
        superjson.stringify({
          error: "Forbidden",
        }),
        { status: 403 }
      );
    }

    const json = superjson.parse(await request.text());
    const { userId, role } = schema.parse(json);

    if (adminUser.id === userId) {
      return new Response(
        superjson.stringify({ error: "Admins cannot change their own role." }),
        { status: 400 }
      );
    }

    // SECURITY: Ensure target user belongs to same organization as admin
    const result = await db
      .updateTable("users")
      .set({ role })
      .where("id", "=", userId)
      .where("organizationId", "=", adminUser.organizationId)
      .executeTakeFirst();

    if (result.numUpdatedRows === 0n) {
        return new Response(
            superjson.stringify({ error: "User not found." }),
            { status: 404 }
        );
    }

    return new Response(
      superjson.stringify({ success: true } satisfies OutputType)
    );
  } catch (error) {
    console.error("Failed to update user role:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: errorMessage,
      }),
      { status: 500 }
    );
  }
}