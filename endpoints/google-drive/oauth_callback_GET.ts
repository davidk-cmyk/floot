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

    if (error) {
      return createPopupResponse({
        success: false,
        error: `Google authorization failed: ${error}`,
      });
    }

    if (!code || !state) {
      return createPopupResponse({
        success: false,
        error: "Invalid authorization response",
      });
    }

    if (!user) {
      return createPopupResponse({
        success: false,
        error: "You must be logged in to connect Google Drive",
      });
    }

    const oauthState = await db
      .selectFrom("oauthStates")
      .select(["codeVerifier", "redirectUrl", "expiresAt"])
      .where("state", "=", state)
      .where("provider", "=", "google-drive")
      .executeTakeFirst();

    if (!oauthState) {
      return createPopupResponse({
        success: false,
        error: "Invalid or expired authorization state. Please try again.",
      });
    }

    await db
      .deleteFrom("oauthStates")
      .where("state", "=", state)
      .execute();

    const now = new Date();
    if (oauthState.expiresAt && new Date(oauthState.expiresAt) < now) {
      return createPopupResponse({
        success: false,
        error: "Authorization expired. Please try again.",
      });
    }

    const redirectUri = oauthState.redirectUrl;

    let provider: GoogleDriveOAuthProvider;
    try {
      provider = new GoogleDriveOAuthProvider(redirectUri);
    } catch (configError) {
      return createPopupResponse({
        success: false,
        error: "Google Drive OAuth is not configured",
      });
    }

    const tokens = await provider.exchangeCodeForTokens(code, redirectUri, oauthState.codeVerifier);
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
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
          .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .success { color: #16a34a; }
          .error { color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <p class="${result.success ? 'success' : 'error'}">
            ${result.success ? `Connected to ${result.email || 'Google Drive'}! This window will close automatically.` : result.error}
          </p>
        </div>
        <script>
          const result = ${JSON.stringify(result)};
          if (window.opener) {
            window.opener.postMessage({ type: "GOOGLE_DRIVE_OAUTH_RESULT", ...result }, location.origin);
            setTimeout(() => window.close(), 2000);
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
