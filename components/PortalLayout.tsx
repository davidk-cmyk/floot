import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Shield } from "lucide-react";
import { useBranding } from "../helpers/useBranding";
import { useOrganization } from "../helpers/useOrganization";
import { useOrgNavigation } from "../helpers/useOrgNavigation";
import { PortalPoweredBy } from "./PortalPoweredBy";
import styles from "./PortalLayout.module.css";

interface PortalLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  className,
}) => {
  const { brandingConfig } = useBranding();
  const { organizationState } = useOrganization();
  const { portalSlug } = useParams<{ portalSlug: string }>();
  const { buildUrl } = useOrgNavigation();

  // Apply branding colors to document root CSS variables for global scope
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--branding-primary', brandingConfig.primaryColor);
    root.style.setProperty('--branding-secondary', brandingConfig.secondaryColor);
    root.style.setProperty('--portal-primary', brandingConfig.primaryColor);
    root.style.setProperty('--portal-secondary', brandingConfig.secondaryColor);
    
    // Cleanup function to remove custom properties when component unmounts
    return () => {
      root.style.removeProperty('--branding-primary');
      root.style.removeProperty('--branding-secondary');
      root.style.removeProperty('--portal-primary');
      root.style.removeProperty('--portal-secondary');
    };
  }, [brandingConfig.primaryColor, brandingConfig.secondaryColor]);

  // Apply custom colors via CSS custom properties for local scope as fallback
  const customStyle = {
    '--branding-primary': brandingConfig.primaryColor,
    '--branding-secondary': brandingConfig.secondaryColor,
    '--portal-primary': brandingConfig.primaryColor,
    '--portal-secondary': brandingConfig.secondaryColor,
  } as React.CSSProperties;

  const orgName = organizationState.type === 'active' 
    ? organizationState.currentOrganization.name 
    : "MyPolicyPortal";

  return (
    <div 
      className={`${styles.layout} ${className || ""}`}
      style={customStyle}
    >
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to={buildUrl(`/${portalSlug}`)} className={styles.logo}>
            {brandingConfig.logoUrl ? (
              <img 
                src={brandingConfig.logoUrl} 
                alt={orgName} 
                className={styles.logoImage} 
              />
            ) : (
              <Shield className={styles.logoFallback} size={24} />
            )}
            <span>{orgName}</span>
          </Link>
          <PortalPoweredBy />
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} {orgName}. All rights reserved.</p>
      </footer>
    </div>
  );
};