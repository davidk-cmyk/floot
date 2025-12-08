import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Shield, Search } from "lucide-react";
import { useBranding } from "../helpers/useBranding";
import { useOrganization } from "../helpers/useOrganization";
import { useOrgNavigation } from "../helpers/useOrgNavigation";
import { PortalPoweredBy } from "./PortalPoweredBy";
import { Input } from "./Input";
import styles from "./PortalLayout.module.css";

interface PortalLayoutProps {
  children: React.ReactNode;
  className?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  className,
  searchTerm = "",
  onSearchChange,
  showSearch = true,
}) => {
  const { brandingConfig } = useBranding();
  const { organizationState } = useOrganization();
  const { portalSlug } = useParams<{ portalSlug: string }>();
  const { buildUrl } = useOrgNavigation();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--branding-primary', brandingConfig.primaryColor);
    root.style.setProperty('--branding-secondary', brandingConfig.secondaryColor);
    root.style.setProperty('--portal-primary', brandingConfig.primaryColor);
    root.style.setProperty('--portal-secondary', brandingConfig.secondaryColor);
    
    return () => {
      root.style.removeProperty('--branding-primary');
      root.style.removeProperty('--branding-secondary');
      root.style.removeProperty('--portal-primary');
      root.style.removeProperty('--portal-secondary');
    };
  }, [brandingConfig.primaryColor, brandingConfig.secondaryColor]);

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
            <div className={styles.logoText}>
              <span className={styles.orgName}>{orgName}</span>
              <span className={styles.portalLabel}>POLICY PORTAL</span>
            </div>
          </Link>
          
          {showSearch && onSearchChange && (
            <div className={styles.headerSearch}>
              <Search className={styles.searchIcon} size={18} />
              <Input
                type="search"
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          )}
          
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
