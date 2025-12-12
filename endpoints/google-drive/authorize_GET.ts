import { getServerUserSession } from "../../helpers/getServerUserSession";
import { GoogleDriveOAuthProvider } from "../../helpers/GoogleDriveOAuthProvider";
import { db } from "../../helpers/db";
import crypto from "crypto";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (!user) {
      return new Response(
        `<html><body><p>Please log in first, then try connecting Google Drive.</p><script>setTimeout(() => window.close(), 3000);</script></body></html>`,
        {
          status: 401,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    const url = new URL(request.url);
    const origin = url.origin.replace(/^http:/, 'https:');
    const redirectUri = `${origin}/_api/google-drive/oauth_callback`;

    let provider: GoogleDriveOAuthProvider;
    try {
      provider = new GoogleDriveOAuthProvider(redirectUri);
    } catch (configError) {
      console.error("Google Drive OAuth not configured:", configError);
      return new Response(
        `<html><body><p>Google Drive is not configured. Please contact your administrator.</p><script>setTimeout(() => window.close(), 3000);</script></body></html>`,
        { status: 500, headers: { "Content-Type": "text/html" } }
      );
    }

    const state = crypto.randomBytes(32).toString("hex");
    const { url: authUrl, codeVerifier } = provider.generateAuthorizationUrl(state);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db
      .insertInto("oauthStates")
      .values({
        state,
        codeVerifier,
        provider: "google-drive",
        redirectUrl: redirectUri,
        expiresAt,
      })
      .execute();

    return new Response(null, {
      status: 302,
      headers: { Location: authUrl },
    });
  } catch (error) {
    console.error("Google Drive authorize error:", error);
    return new Response(
      `<html><body><p>Failed to initiate Google Drive authorization. Please try again.</p><script>setTimeout(() => window.close(), 3000);</script></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}
