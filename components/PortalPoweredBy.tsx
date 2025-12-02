import React from "react";
import { Link } from "react-router-dom";
import styles from "./PortalPoweredBy.module.css";

interface PortalPoweredByProps {
  className?: string;
}

export const PortalPoweredBy: React.FC<PortalPoweredByProps> = ({ className }) => {
  return (
    <div className={`${styles.container} ${className || ""}`}>
      <span className={styles.text}>Powered by </span>
      <Link to="/" className={styles.link}>
        MyPolicyPortal.com
      </Link>
    </div>
  );
};