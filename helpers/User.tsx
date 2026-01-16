// If you need to udpate this type, make sure to also update
// components/ProtectedRoute
// endpoints/auth/login_with_password_POST
// endpoints/auth/register_with_password_POST
// endpoints/auth/session_GET
// helpers/getServerUserSession
// together with this in one toolcall.

export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  organizationId: number | null;
  // adjust this as necessary
  role: "admin" | "editor" | "approver" | "user";
  oauthProvider: string | null;
  hasLoggedIn: boolean;
  isSuperAdmin: boolean;
  // Set when super admin is impersonating a user
  impersonating?: {
    organizationId: number;
    organizationName: string;
    userId: number;
    userDisplayName: string;
    userEmail: string;
    userRole: "admin" | "editor" | "approver" | "user";
    startedAt: string;
  };
}
