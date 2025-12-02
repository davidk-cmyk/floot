import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  fileId: z.string().min(1, "File ID is required."),
  accessToken: z.string().min(1, "Access token is required."),
});

export type InputType = z.infer<typeof schema>;

// The output is a file stream, so the client will handle the Response directly.
// We don't define a specific OutputType here as it's not JSON on success.
// The client function will return Promise<Response>.

export const postGoogleDriveDownload = async (
  body: InputType,
  init?: RequestInit
): Promise<Response> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/google-drive/download`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    // Try to parse error as JSON, but fallback to text
    try {
      const errorObject = superjson.parse<{ error: string; details?: any }>(
        await result.text()
      );
      const errorMessage =
        errorObject.error || "Failed to download file from Google Drive.";
      console.error("Download error:", errorMessage, errorObject.details);
      throw new Error(errorMessage);
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }
      throw new Error(
        "An unexpected error occurred while downloading the file."
      );
    }
  }

  // On success, return the raw response for the client to handle the file blob
  return result;
};