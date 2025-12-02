import React from "react";
import { Search } from "lucide-react";
import { Input } from "./Input";
import styles from "./PortalHero.module.css";

interface PortalHeroProps {
  portalName: string;
  description?: string | null;
  portalType?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  className?: string;
}

export const PortalHero: React.FC<PortalHeroProps> = ({
  portalName,
  description,
  portalType = "Internal Portal",
  searchTerm,
  onSearchChange,
  className,
}) => {
  return (
    <div className={`${styles.hero} ${className || ""}`}>
      <div className={styles.content}>
        <div className={styles.badge}>{portalType}</div>
        <h1 className={styles.title}>{portalName}</h1>
        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <Input
              type="search"
              placeholder="Search for policies, documents, or keywords..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>
    </div>
  );
};