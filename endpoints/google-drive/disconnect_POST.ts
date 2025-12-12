import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db
      .deleteFrom("userGoogleDriveConnections")
      .where("userId", "=", user.id)
      .execute();

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Google Drive disconnect error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to disconnect Google Drive" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
