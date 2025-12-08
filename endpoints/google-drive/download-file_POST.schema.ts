import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  fileId: z.string().min(1, "File ID is required"),
});

export type InputType = z.infer<typeof schema>;

export interface DownloadFileResponse {
  title: string;
  content: string;
  fileName: string;
}

export async function postDownloadGoogleDriveFile(fileId: string): Promise<DownloadFileResponse> {
  const response = await fetch("/_api/google-drive/download-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: superjson.stringify({ fileId }),
  });

  const data = superjson.parse<DownloadFileResponse | { error: string }>(await response.text());
  
  if ("error" in data) {
    throw new Error(data.error);
  }
  
  return data;
}
