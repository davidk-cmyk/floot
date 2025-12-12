import { getServerUserSession } from "../../helpers/getServerUserSession";
import { GoogleDriveOAuthProvider } from "../../helpers/GoogleDriveOAuthProvider";
import crypto from "crypto";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const redirectUri = `${url.origin}/_api/google-drive/oauth_callback`;

    let provider: GoogleDriveOAuthProvider;
    try {
      provider = new GoogleDriveOAuthProvider(redirectUri);
    } catch (configError) {
      console.error("Google Drive OAuth not configured:", configError);
      return new Response(
        JSON.stringify({
          error: "Google Drive OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const state = crypto.randomBytes(32).toString("hex");
    const { url: authUrl, codeVerifier } = provider.generateAuthorizationUrl(state);

    return new Response(
      JSON.stringify({
        authUrl,
        state,
        codeVerifier,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Google Drive authorize error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to initiate Google Drive authorization" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
