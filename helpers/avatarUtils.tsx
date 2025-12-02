import { User } from "./User";

/**
 * Generates initials from a display name.
 * Handles various formats gracefully.
 * - "John Doe" -> "JD"
 * - "Single" -> "SI"
 * - " john   doe " -> "JD"
 * - "" -> ""
 *
 * @param displayName The user's full display name.
 * @returns A string of 1 or 2 characters representing the initials, or an empty string if the name is empty.
 */
export const getInitials = (displayName: string | null | undefined): string => {
  if (!displayName) {
    return "";
  }

  const cleanedName = displayName.trim();
  if (!cleanedName) {
    return "";
  }

  const names = cleanedName.split(/\s+/).filter(Boolean);

  if (names.length === 0) {
    return "";
  }

  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }

  const firstInitial = names[0][0];
  const lastInitial = names[names.length - 1][0];

  return `${firstInitial}${lastInitial}`.toUpperCase();
};

/**
 * A type representing the props needed to render an avatar.
 */
export type AvatarProps = {
  image: {
    src?: string;
    alt: string;
  };
  fallback: {
    children: string;
  };
};

/**
 * Generates the necessary props for rendering the Avatar, AvatarImage,
 * and AvatarFallback components consistently across the application.
 *
 * It decides whether to use the avatarUrl for the image or generate
 * initials for the fallback based on OAuth provider:
 * - Google OAuth users with avatarUrl: use the Google profile picture
 * - All other cases: use initials as fallback
 *
 * @param user An object containing the user's displayName, optional avatarUrl, and oauthProvider.
 * @returns An object with props for the image and fallback components.
 */
export const getAvatarProps = (
  user: Pick<User, "displayName" | "avatarUrl" | "oauthProvider">
): AvatarProps => {
  const shouldUseAvatarUrl = user.oauthProvider === "google" && user.avatarUrl;

  return {
    image: {
      src: shouldUseAvatarUrl ? (user.avatarUrl ?? undefined) : undefined,
      alt: user.displayName,
    },
    fallback: {
      children: getInitials(user.displayName),
    },
  };
};