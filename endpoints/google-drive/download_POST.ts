import { schema } from "./download_POST.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const validationResult = schema.safeParse(json);

    if (!validationResult.success) {
      return new Response(
        superjson.stringify({
          error: "Invalid input",
          details: validationResult.error.flatten(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { fileId, accessToken } = validationResult.data;
    const googleDriveApiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    console.log(`Attempting to download file from Google Drive: ${fileId}`);

    const driveResponse = await fetch(googleDriveApiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!driveResponse.ok) {
      let errorDetails = `Google Drive API responded with status ${driveResponse.status}.`;
      try {
        const errorJson = await driveResponse.json();
        errorDetails =
          errorJson?.error?.message || JSON.stringify(errorJson.error);
        console.error(
          "Google Drive API error:",
          driveResponse.status,
          errorDetails
        );
      } catch (e) {
        // The error response was not JSON
        const errorText = await driveResponse.text();
        console.error(
          "Google Drive API non-JSON error:",
          driveResponse.status,
          errorText
        );
        errorDetails = errorText || errorDetails;
      }

      return new Response(
        superjson.stringify({
          error: "Failed to download file from Google Drive.",
          details: errorDetails,
        }),
        {
          status: driveResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Successfully fetched file ${fileId} from Google Drive.`);

    // Stream the file content directly to the client
    // We create a new Response to control headers and avoid leaking internal details
    const headers = new Headers();
    const contentType = driveResponse.headers.get("Content-Type");
    const contentDisposition = driveResponse.headers.get("Content-Disposition");
    const contentLength = driveResponse.headers.get("Content-Length");

    if (contentType) {
      headers.set("Content-Type", contentType);
    }
    if (contentDisposition) {
      headers.set("Content-Disposition", contentDisposition);
    }
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(driveResponse.body, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error("Error in google-drive/download endpoint:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(
      superjson.stringify({
        error: "An internal server error occurred.",
        details: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}