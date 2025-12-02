interface GenerateInviteLinkParams {
  email: string;
  /**
   * Optional path to redirect the user to after successful login or signup.
   * e.g., '/dashboard' or '/policies/123'
   */
  redirectTo?: string;
}

/**
 * Generates a user-specific invitation link for the MyPolicyPortal application.
 *
 * This function constructs a full URL pointing to the login page, with the user's
 * email pre-filled in the form. It also includes a 'source' parameter to identify
 * that the user arrived via an invitation, which can be used for analytics or
 * customizing the user experience on the login/signup page.
 *
 * It dynamically uses the current window's origin, making it environment-agnostic
 * (works for development, staging, and production without changes).
 *
 * @param params - The parameters for generating the link.
 * @param params.email - The email address of the user being invited.
 * @param params.redirectTo - An optional path to redirect the user to after they log in or sign up.
 * @returns A complete, shareable invitation URL as a string.
 *
 * @example
 * const inviteUrl = generateInviteLink({ email: 'new.user@example.com', redirectTo: '/welcome' });
 * // Returns something like: "https://your-domain.com/login?email=new.user%40example.com&source=invite&redirectTo=%2Fwelcome"
 */
export const generateInviteLink = ({
  email,
  redirectTo,
}: GenerateInviteLinkParams): string => {
  // This helper is intended for client-side use where `window.location` is available.
  if (typeof window === "undefined") {
    // This case should ideally not be hit in a standard Floot app.
    // Providing a relative URL as a non-ideal fallback.
    console.error(
      "generateInviteLink was called in a non-browser environment. A relative URL will be returned."
    );
    const searchParams = new URLSearchParams();
    searchParams.set("email", email);
    searchParams.set("source", "invite");
    if (redirectTo) {
      searchParams.set("redirectTo", redirectTo);
    }
    return `/login?${searchParams.toString()}`;
  }

  const origin = window.location.origin;
  const loginUrl = new URL("/login", origin);

  loginUrl.searchParams.set("email", email);
  loginUrl.searchParams.set("source", "invite");

  if (redirectTo) {
    // Ensure the redirect path starts with a slash to prevent open redirects.
    const safeRedirectTo = redirectTo.startsWith("/")
      ? redirectTo
      : `/${redirectTo}`;
    loginUrl.searchParams.set("redirectTo", safeRedirectTo);
  }

  return loginUrl.toString();
};