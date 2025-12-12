import {
  OAuthTokens,
  OAuthError,
} from "./OAuthProvider";
import * as crypto from "crypto";

export class GoogleDriveOAuthProvider {
  public readonly name = "google-drive";
  public readonly clientId: string;
  public readonly authUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  public readonly scopes = "https://www.googleapis.com/auth/drive.readonly email";
  public readonly redirectUri: string;
  private readonly clientSecret: string;
  private readonly tokenUrl = "https://oauth2.googleapis.com/token";
  private readonly userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";

  constructor(redirectUri: string) {
    this.clientId = process.env.GOOGLE_CLIENT_ID || "";
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    this.redirectUri = redirectUri;

    if (!this.clientId) {
      const error = new Error(
        "GOOGLE_CLIENT_ID environment variable is required"
      );
      console.error("GoogleDriveOAuthProvider initialization failed:", error);
      throw error;
    }

    if (!this.clientSecret) {
      const error = new Error(
        "GOOGLE_CLIENT_SECRET environment variable is required"
      );
      console.error("GoogleDriveOAuthProvider initialization failed:", error);
      throw error;
    }
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<OAuthTokens> {
    console.log(
      "GoogleDriveOAuthProvider: Exchanging authorization code for tokens",
      {
        codeLength: code.length,
        redirectUri,
        hasPKCE: !!codeVerifier,
      }
    );

    const requestBody = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri,
      ...(codeVerifier && { code_verifier: codeVerifier }),
    });

    let response: Response;
    try {
      response = await fetch(this.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody.toString(),
      });
    } catch (fetchError) {
      console.error("GoogleDriveOAuthProvider: Token exchange fetch error:", {
        error:
          fetchError instanceof Error ? fetchError.message : String(fetchError),
        url: this.tokenUrl,
      });

      throw new OAuthError(
        "NETWORK_ERROR",
        `Token exchange request failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
        this.name,
        fetchError
      );
    }

    if (!response.ok) {
      let errorText: string;
      try {
        errorText = await response.text();
      } catch (textError) {
        errorText = "Could not read error response body";
      }

      console.error(
        "GoogleDriveOAuthProvider: Token exchange failed with error response:",
        {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        }
      );

      throw new OAuthError(
        "TOKEN_EXCHANGE_FAILED",
        `Token exchange failed: ${response.status} ${response.statusText}. Response: ${errorText}`,
        this.name,
        { status: response.status, body: errorText }
      );
    }

    let data: any;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new OAuthError(
        "TOKEN_EXCHANGE_FAILED",
        `Token exchange succeeded but response is not valid JSON`,
        this.name,
        jsonError
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type || "Bearer",
      scope: data.scope,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    console.log("GoogleDriveOAuthProvider: Refreshing access token");

    const requestBody = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    let response: Response;
    try {
      response = await fetch(this.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody.toString(),
      });
    } catch (fetchError) {
      throw new OAuthError(
        "NETWORK_ERROR",
        `Token refresh request failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
        this.name,
        fetchError
      );
    }

    if (!response.ok) {
      let errorText: string;
      try {
        errorText = await response.text();
      } catch {
        errorText = "Could not read error response body";
      }

      throw new OAuthError(
        "TOKEN_EXCHANGE_FAILED",
        `Token refresh failed: ${response.status} ${response.statusText}. Response: ${errorText}`,
        this.name,
        { status: response.status, body: errorText }
      );
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken,
      expiresIn: data.expires_in,
      tokenType: data.token_type || "Bearer",
      scope: data.scope,
    };
  }

  async fetchUserInfo(tokens: OAuthTokens): Promise<{ email: string }> {
    const tokenType = tokens.tokenType || "Bearer";
    const authHeader = `${tokenType} ${tokens.accessToken}`;

    let response: Response;
    try {
      response = await fetch(this.userInfoUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });
    } catch (fetchError) {
      throw new OAuthError(
        "NETWORK_ERROR",
        `User info request failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
        this.name,
        fetchError
      );
    }

    if (!response.ok) {
      let errorText: string;
      try {
        errorText = await response.text();
      } catch {
        errorText = "Could not read error response body";
      }

      throw new OAuthError(
        "USER_INFO_FETCH_FAILED",
        `User info fetch failed: ${response.status} ${response.statusText}. Response: ${errorText}`,
        this.name,
        { status: response.status, body: errorText }
      );
    }

    const data = await response.json();
    return { email: data.email };
  }

  private generateCodeVerifier(): string {
    const buffer = crypto.randomBytes(32);
    return buffer
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  private generateCodeChallenge(verifier: string): string {
    const hash = crypto.createHash("sha256").update(verifier).digest();
    return hash
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  generateAuthorizationUrl(state: string): {
    url: string;
    codeVerifier: string;
  } {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      access_type: "offline",
      prompt: "consent",
    });

    const authUrl = `${this.authUrl}?${params.toString()}`;

    return { url: authUrl, codeVerifier };
  }
}
