import { getServerUserSession } from "../../helpers/getServerUserSession";
import { listGoogleDriveFilesForUser, isGoogleDriveConnectedForUser } from "../../helpers/googleDriveClient";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    if (!user) {
      return new Response(
        superjson.stringify({ error: "Unauthorized", connected: false }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || undefined;
    
    const isConnected = await isGoogleDriveConnectedForUser(user.id);
    if (!isConnected) {
      return new Response(
        superjson.stringify({ 
          error: "Google Drive not connected",
          connected: false 
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const files = await listGoogleDriveFilesForUser(user.id, query);
    
    return new Response(
      superjson.stringify({ files, connected: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error listing Google Drive files:", error);
    return new Response(
      superjson.stringify({ 
        error: error instanceof Error ? error.message : "Failed to list files",
        connected: false
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
