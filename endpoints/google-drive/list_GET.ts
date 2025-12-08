import { getServerUserSession } from "../../helpers/getServerUserSession";
import { listGoogleDriveFiles, isGoogleDriveConnected } from "../../helpers/googleDriveClient";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    await getServerUserSession(request);
    
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || undefined;
    
    const isConnected = await isGoogleDriveConnected();
    if (!isConnected) {
      return new Response(
        superjson.stringify({ 
          error: "Google Drive not connected",
          connected: false 
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const files = await listGoogleDriveFiles(query);
    
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
