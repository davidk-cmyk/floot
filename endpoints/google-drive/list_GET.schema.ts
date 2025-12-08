import superjson from "superjson";

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  iconLink?: string;
  webViewLink?: string;
}

export interface ListFilesResponse {
  files: GoogleDriveFile[];
  connected: boolean;
}

export async function getGoogleDriveFiles(query?: string): Promise<ListFilesResponse> {
  const url = new URL("/_api/google-drive/list", window.location.origin);
  if (query) {
    url.searchParams.set("q", query);
  }
  
  const response = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
  });

  const data = superjson.parse<ListFilesResponse | { error: string; connected: boolean }>(await response.text());
  
  if ("error" in data) {
    if (data.connected === false) {
      return { files: [], connected: false };
    }
    throw new Error(data.error);
  }
  
  return data;
}
