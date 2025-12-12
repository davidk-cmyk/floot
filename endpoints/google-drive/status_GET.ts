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

    const connection = await db
      .selectFrom("userGoogleDriveConnections")
      .select(["googleEmail", "expiresAt"])
      .where("userId", "=", user.id)
      .executeTakeFirst();

    const hasCredentials = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

    return new Response(
      JSON.stringify({
        connected: !!connection,
        email: connection?.googleEmail || null,
        configured: hasCredentials,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Google Drive status error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to check Google Drive status" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
