import React from 'react';
import styles from './PolicyVersionBadge.module.css';

interface PolicyVersionBadgeProps {
  versionNumber: number | null | undefined;
  className?: string;
}

export const PolicyVersionBadge: React.FC<PolicyVersionBadgeProps> = ({ versionNumber, className }) => {
  if (versionNumber === null || typeof versionNumber === 'undefined') {
    return null;
  }

  return (
    <div className={`${styles.badge} ${className || ''}`}>
      v{versionNumber}
    </div>
  );
};