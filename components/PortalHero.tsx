import React from "react";
import styles from "./PortalHero.module.css";

interface PortalHeroProps {
  portalName: string;
  description?: string | null;
  portalType?: string;
  className?: string;
}

export const PortalHero: React.FC<PortalHeroProps> = ({
  portalName,
  description,
  portalType = "Internal Portal",
  className,
}) => {
  return (
    <div className={`${styles.hero} ${className || ""}`}>
      <div className={styles.content}>
        <div className={styles.badge}>{portalType}</div>
        <h1 className={styles.title}>{portalName}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
    </div>
  );
};
