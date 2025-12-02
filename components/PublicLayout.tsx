import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { useBranding } from "../helpers/useBranding";
import { useOrganization } from "../helpers/useOrganization";
import styles from "./PublicLayout.module.css";

interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  className,
}) => {
  const { brandingConfig, isLoading } = useBranding();
  const { organizationState } = useOrganization();

  // Apply branding colors to document root CSS variables for global scope
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--branding-primary', brandingConfig.primaryColor);
    root.style.setProperty('--branding-secondary', brandingConfig.secondaryColor);
    
    // Cleanup function to remove custom properties when component unmounts
    return () => {
      root.style.removeProperty('--branding-primary');
      root.style.removeProperty('--branding-secondary');
    };
  }, [brandingConfig.primaryColor, brandingConfig.secondaryColor]);

  // Apply custom colors via CSS custom properties for local scope as fallback
  const customStyle = {
    '--branding-primary': brandingConfig.primaryColor,
    '--branding-secondary': brandingConfig.secondaryColor,
  } as React.CSSProperties;

  return (
    <div 
      className={`${styles.layout} ${className || ""}`}
      style={customStyle}
    >
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            {brandingConfig.logoUrl ? (
              <img 
                src={brandingConfig.logoUrl} 
                alt={organizationState.type === 'active' 
                  ? organizationState.currentOrganization.name 
                  : "MyPolicyPortal"
                } 
                className={styles.logoImage} 
              />
            ) : (
              <Shield className={styles.logoFallback} size={24} />
            )}
            <span>
              {organizationState.type === 'active' 
                ? organizationState.currentOrganization.name 
                : (isLoading ? "Loading..." : "MyPolicyPortal")
              }
            </span>
          </Link>
          <nav className={styles.nav}>
            <Link to="/login" className={styles.navLink}>
              Go to your account
            </Link>
            <Link to="/register-organization" className={styles.navLink}>
              Create an account
            </Link>
          </nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} {brandingConfig.portalName}. All rights reserved.</p>
      </footer>
    </div>
  );
};