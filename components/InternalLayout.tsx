import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { useOrganization } from "../helpers/useOrganization";
import { useOrgFromUrl } from "../helpers/useOrgFromUrl";
import { useOrgNavigation } from "../helpers/useOrgNavigation";
import styles from "./InternalLayout.module.css";
import { toast } from "sonner";

interface InternalLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const InternalLayout: React.FC<InternalLayoutProps> = ({
  children,
  className,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { organizationState } = useOrganization();
  const { buildUrl } = useOrgNavigation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("You have been logged out.");
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <div className={`${styles.layout} ${className || ""}`}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to={buildUrl("/internal")} className={styles.logo}>
            <Shield size={24} />
            <span>
              {organizationState.type === 'active' 
                ? `${organizationState.currentOrganization.name} - Internal`
                : "Internal Portal"
              }
            </span>
          </Link>
          <nav className={styles.nav}>
            <Link to={buildUrl("/admin/dashboard")} className={styles.navLink}>
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <button onClick={handleLogout} className={styles.logoutButton}>
              <LogOut size={16} />
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>Confidential &copy; {new Date().getFullYear()} {organizationState.type === 'active' ? organizationState.currentOrganization.name : "MyPolicyPortal"}.</p>
      </footer>
    </div>
  );
};