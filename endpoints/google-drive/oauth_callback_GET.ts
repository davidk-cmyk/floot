import { getServerUserSession } from "../../helpers/getServerUserSession";
import { GoogleDriveOAuthProvider } from "../../helpers/GoogleDriveOAuthProvider";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const codeVerifier = url.searchParams.get("code_verifier");

    if (error) {
      return createPopupResponse({
        success: false,
        error: `Google authorization failed: ${error}`,
      });
    }

    if (!code) {
      return createPopupResponse({
        success: false,
        error: "No authorization code received",
      });
    }

    if (!user) {
      return createPopupResponse({
        success: false,
        error: "You must be logged in to connect Google Drive",
      });
    }

    const redirectUri = `${url.origin}/_api/google-drive/oauth_callback`;

    let provider: GoogleDriveOAuthProvider;
    try {
      provider = new GoogleDriveOAuthProvider(redirectUri);
    } catch (configError) {
      return createPopupResponse({
        success: false,
        error: "Google Drive OAuth is not configured",
      });
    }

    const tokens = await provider.exchangeCodeForTokens(code, redirectUri, codeVerifier || undefined);
    const userInfo = await provider.fetchUserInfo(tokens);

    const expiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;

    const existing = await db
      .selectFrom("userGoogleDriveConnections")
      .select("id")
      .where("userId", "=", user.id)
      .executeTakeFirst();

    if (existing) {
      await db
        .updateTable("userGoogleDriveConnections")
        .set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
          expiresAt,
          googleEmail: userInfo.email,
          updatedAt: new Date(),
        })
        .where("userId", "=", user.id)
        .execute();
    } else {
      await db
        .insertInto("userGoogleDriveConnections")
        .values({
          userId: user.id,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
          expiresAt,
          googleEmail: userInfo.email,
        })
        .execute();
    }

    return createPopupResponse({
      success: true,
      email: userInfo.email,
    });
  } catch (error) {
    console.error("Google Drive OAuth callback error:", error);
    return createPopupResponse({
      success: false,
      error: error instanceof Error ? error.message : "Failed to connect Google Drive",
    });
  }
}

function createPopupResponse(result: { success: boolean; email?: string; error?: string }): Response {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Drive Connection</title>
      </head>
      <body>
        <p>${result.success ? "Connected successfully! Closing..." : result.error}</p>
        <script>
          const result = ${JSON.stringify(result)};
          if (window.opener) {
            window.opener.postMessage({ type: "GOOGLE_DRIVE_OAUTH_RESULT", ...result }, location.origin);
            setTimeout(() => window.close(), 1000);
          }
        </script>
      </body>
    </html>
  `;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
