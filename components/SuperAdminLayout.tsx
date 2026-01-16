import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../helpers/useAuth";
import { Shield, LogOut } from "lucide-react";
import styles from "./SuperAdminLayout.module.css";

interface Props {
  children: React.ReactNode;
}

export const SuperAdminLayout: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/_api/superadmin/logout", { method: "POST" });
      navigate("/superadmin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brand}>
            <Shield size={24} />
            <span className={styles.title}>Super Admin Panel</span>
          </div>
          <div className={styles.headerRight}>
            {authState.type === "authenticated" && (
              <span className={styles.userEmail}>
                {authState.user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className={styles.logoutButton}
              disabled={isLoggingOut}
            >
              <LogOut size={18} />
              <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </button>
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
};
