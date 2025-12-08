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
    const primary = brandingConfig.primaryColor;
    const secondary = brandingConfig.secondaryColor;
    
    root.style.setProperty('--branding-primary', primary);
    root.style.setProperty('--branding-secondary', secondary);
    root.style.setProperty('--portal-primary', primary);
    root.style.setProperty('--portal-secondary', secondary);
    root.style.setProperty('--portal-accent', primary);
    root.style.setProperty('--portal-hero-bg', `color-mix(in srgb, ${primary} 8%, hsl(0, 0%, 97%))`);
    root.style.setProperty('--portal-background', `color-mix(in srgb, ${primary} 3%, hsl(0, 0%, 98%))`);
    
    return () => {
      root.style.removeProperty('--branding-primary');
      root.style.removeProperty('--branding-secondary');
      root.style.removeProperty('--portal-primary');
      root.style.removeProperty('--portal-secondary');
      root.style.removeProperty('--portal-accent');
      root.style.removeProperty('--portal-hero-bg');
      root.style.removeProperty('--portal-background');
    };
  }, [brandingConfig.primaryColor, brandingConfig.secondaryColor]);

  const customStyle = {
    '--branding-primary': brandingConfig.primaryColor,
    '--branding-secondary': brandingConfig.secondaryColor,
    '--portal-primary': brandingConfig.primaryColor,
    '--portal-secondary': brandingConfig.secondaryColor,
    '--portal-accent': brandingConfig.primaryColor,
    '--portal-hero-bg': `color-mix(in srgb, ${brandingConfig.primaryColor} 8%, hsl(0, 0%, 97%))`,
    '--portal-background': `color-mix(in srgb, ${brandingConfig.primaryColor} 3%, hsl(0, 0%, 98%))`,
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
