import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Paintbrush, BookCopy, Users, Globe, Globe2, FileText, Building, FileCode } from 'lucide-react';
import styles from './SettingsNavigation.module.css';

interface NavItem {
  hash: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { hash: '#branding', label: 'Branding & Appearance', icon: Paintbrush },
  { hash: '#policy-management', label: 'Policy Management', icon: BookCopy },
  { hash: '#portals', label: 'Portal Management', icon: Globe2 },
  { hash: '#policy-documents', label: 'Layout Settings', icon: FileText },
  { hash: '#user-access', label: 'User Access', icon: Users, disabled: true },
  { hash: '#acknowledgment-settings', label: 'Policy Acknowledgment', icon: BookCopy, disabled: true },
  { hash: '#organizations', label: 'Organisation', icon: Building },
  { hash: '#organization-variables', label: 'Organisation Variables', icon: FileCode },
];

const externalNavItems: never[] = [];

export const SettingsNavigation = ({ className }: { className?: string }) => {
  const location = useLocation();
  const activeHash = location.hash || navItems[0].hash;

  return (
    <nav className={`${styles.nav} ${className ?? ''}`}>
      <ul className={styles.navList}>
        {navItems.map((item) => (
          <li key={item.hash}>
            {item.disabled ? (
              <span
                className={`${styles.navLink} ${styles.navLinkDisabled}`}
              >
                <item.icon size={18} className={styles.navIcon} />
                <span className={styles.navLabel}>
                  {item.label}
                  <span className={styles.soonBadge}>Soon</span>
                </span>
              </span>
            ) : (
              <Link
                to={{ hash: item.hash }}
                className={`${styles.navLink} ${activeHash === item.hash ? styles.activeLink : ''}`}
              >
                <item.icon size={18} className={styles.navIcon} />
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            )}
          </li>
        ))}

      </ul>
    </nav>
  );
};