import React from 'react';
import styles from './DashboardPageHeader.module.css';

interface DashboardPageHeaderProps {
  /** The main title of the page. */
  title: string;
  /** A subtitle or description displayed below the title. */
  subtitle?: string | React.ReactNode;
  /** Optional breadcrumb navigation component. */
  breadcrumbs?: React.ReactNode;
  /** Optional action elements, like buttons, to display on the right. */
  actions?: React.ReactNode;
  /** Optional additional class names. */
  className?: string;
}

/**
 * A reusable header component for dashboard pages.
 * It provides a consistent layout for title, subtitle, breadcrumbs, and action buttons.
 */
export const DashboardPageHeader: React.FC<DashboardPageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}) => {
  return (
    <header className={`${styles.header} ${className ?? ''}`}>
      <div className={styles.content}>
        {breadcrumbs}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
};