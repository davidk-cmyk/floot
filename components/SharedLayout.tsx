import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../helpers/useAuth';
import { useOrgFromUrl } from '../helpers/useOrgFromUrl';
import { Button } from './Button';
import { UserAvatar } from './UserAvatar';
import { LogOut, LayoutDashboard, BookOpen, Shield } from 'lucide-react';
import styles from './SharedLayout.module.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu';

interface SharedLayoutProps {
  children: React.ReactNode;
}



export const SharedLayout: React.FC<SharedLayoutProps> = ({ children }) => {
  const { authState, logout } = useAuth();
  const { organizationId } = useOrgFromUrl();

  const buildOrgUrl = (path: string): string => {
    if (!organizationId) {
      return path;
    }
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/${organizationId}${cleanPath}`;
  };

  const renderAuthControls = () => {
    if (authState.type === 'loading') {
      return <div className={styles.authPlaceholder} />;
    }

    if (authState.type === 'authenticated') {
      const { user } = authState;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={styles.avatarButton}>
              <UserAvatar user={user} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={styles.dropdownContent}>
            <DropdownMenuLabel>
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownDisplayName}>{user.displayName}</p>
                <p className={styles.dropdownEmail}>{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={buildOrgUrl("/admin/dashboard")}>
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={buildOrgUrl("/admin/policies")}>
                <BookOpen size={16} />
                <span>Policies</span>
              </Link>
            </DropdownMenuItem>
            {user.role === 'admin' && (
              <DropdownMenuItem asChild>
                <Link to={buildOrgUrl("/admin")}>
                  <Shield size={16} />
                  <span>Admin</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut size={16} />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className={styles.authActions}>
        <Button asChild variant="ghost">
          <Link to="/login">Log In</Link>
        </Button>
        <Button asChild>
          <Link to="/login?tab=signup">Sign Up</Link>
        </Button>
      </div>
    );
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <Shield size={28} className={styles.logoIcon} />
            <span className={styles.logoText}>MyPolicyPortal</span>
          </Link>
          <nav className={styles.nav}>
            <NavLink to="/features" className={({ isActive }) => (isActive ? styles.activeLink : styles.navLink)}>
              Features
            </NavLink>
            <NavLink to="/pricing" className={({ isActive }) => (isActive ? styles.activeLink : styles.navLink)}>
              Pricing
            </NavLink>
            <NavLink to="/contact" className={({ isActive }) => (isActive ? styles.activeLink : styles.navLink)}>
              Contact
            </NavLink>
          </nav>
          <div className={styles.headerRight}>
            {renderAuthControls()}
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} MyPolicyPortal. All rights reserved.</p>
      </footer>
    </div>
  );
};