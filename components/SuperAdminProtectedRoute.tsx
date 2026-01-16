import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../helpers/useAuth";
import { AuthErrorPage } from "./AuthErrorPage";
import { ShieldOff } from "lucide-react";
import { AuthLoadingState } from "./AuthLoadingState";

interface Props {
  children: React.ReactNode;
}

export const SuperAdminProtectedRoute: React.FC<Props> = ({ children }) => {
  const { authState } = useAuth();

  if (authState.type === "loading") {
    return <AuthLoadingState title="Verifying access" />;
  }

  if (authState.type === "unauthenticated") {
    return <Navigate to="/superadmin/login" replace />;
  }

  if (!authState.user.isSuperAdmin) {
    return (
      <AuthErrorPage
        title="Access Denied"
        message="Super admin access is required to view this page."
        icon={<ShieldOff size={64} />}
      />
    );
  }

  return <>{children}</>;
};
