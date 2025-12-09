import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../helpers/useAuth';
import { useOrganization } from '../helpers/useOrganization';
import { useOrgNavigation } from '../helpers/useOrgNavigation';
import { useOverdueCount } from '../helpers/usePolicyApi';
import { Button } from './Button';
import { Badge } from './Badge';
import { UserAvatar } from './UserAvatar';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { NotificationBell } from './NotificationBell';
import { Separator } from './Separator';
import { LogOut, LayoutDashboard, BookOpen, Shield, Users, Settings, History, ChevronLeft, ChevronRight, CheckCircle, FileText, HelpCircle, MessageCircleQuestion } from 'lucide-react';
import { PortalQuickAccessList } from './PortalQuickAccessList';
import styles from './DashboardLayout.module.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu';

interface DashboardLayoutProps {
  children: React.ReactNode;
}



const SIDEBAR_COLLAPSED_KEY = 'dashboard-sidebar-collapsed';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { authState, logout } = useAuth();
  const { organizationState } = useOrganization();
  const { buildUrl } = useOrgNavigation();
  const { data: overdueCount = 0, isFetching: isLoadingOverdue } = useOverdueCount();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const user = authState.type === 'authenticated' ? authState.user : null;

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (savedState) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setSidebarCollapsed(prev => !prev);
  };

  const renderUserMenu = () => {
    if (!user) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={`${styles.avatarButton} ${sidebarCollapsed ? styles.collapsedAvatarButton : ''}`}>
            <UserAvatar user={user} />
            {!sidebarCollapsed && <span className={styles.userName}>{user.displayName}</span>}
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
          <DropdownMenuItem onClick={logout}>
            <LogOut size={16} />
            <span>Log Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsedSidebar : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={`${styles.logoContainer} ${sidebarCollapsed ? styles.collapsedLogoContainer : ''}`}>
            <Link to={buildUrl('/admin/dashboard')} className={`${styles.logo} ${sidebarCollapsed ? styles.collapsedLogo : ''}`}>
              <Shield size={28} className={styles.logoIcon} />
              {!sidebarCollapsed && (
                <span className={styles.logoText}>
                  MyPolicyPortal
                </span>
              )}
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className={styles.toggleButton}
              onClick={toggleSidebar}
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </Button>
          </div>
          <nav className={styles.nav}>
            <NavLink to={buildUrl('/admin/dashboard')} end className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''} ${sidebarCollapsed ? styles.collapsedNavLink : ''}`}>
              <LayoutDashboard size={20} />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </NavLink>
            <NavLink to={buildUrl('/admin/policies')} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''} ${sidebarCollapsed ? styles.collapsedNavLink : ''}`}>
              <BookOpen size={20} />
              {!sidebarCollapsed && <span>Policies</span>}
              {overdueCount > 0 && !isLoadingOverdue && (
                <Badge variant="destructive" className={styles.overdueBadge}>
                  {overdueCount}
                </Badge>
              )}
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to={buildUrl('/admin/users')} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''} ${sidebarCollapsed ? styles.collapsedNavLink : ''}`}>
                <Users size={20} />
                {!sidebarCollapsed && <span>Users</span>}
              </NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink to={buildUrl('/admin/acknowledgements')} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''} ${sidebarCollapsed ? styles.collapsedNavLink : ''}`}>
                <CheckCircle size={20} />
                {!sidebarCollapsed && <span>Acknowledgements</span>}
              </NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink to={buildUrl('/admin/audit')} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''} ${sidebarCollapsed ? styles.collapsedNavLink : ''}`}>
                <History size={20} />
                {!sidebarCollapsed && <span>Audit Trail</span>}
              </NavLink>
            )}
            <hr className={styles.navSeparator} />
            <NavLink to={buildUrl('/admin/handbook')} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''} ${sidebarCollapsed ? styles.collapsedNavLink : ''}`}>
              <FileText size={20} />
              {!sidebarCollapsed && (
                <>
                  <span>Handbook</span>
                  <Badge variant="secondary" className={styles.comingSoonBadge}>Soon</Badge>
                </>
              )}
            </NavLink>
            <NavLink to={buildUrl('/admin/faq')} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''} ${sidebarCollapsed ? styles.collapsedNavLink : ''}`}>
              <HelpCircle size={20} />
              {!sidebarCollapsed && (
                <>
                  <span>FAQ</span>
                  <Badge variant="secondary" className={styles.comingSoonBadge}>Soon</Badge>
                </>
              )}
            </NavLink>
            <NavLink to={buildUrl('/admin/assistant')} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''} ${sidebarCollapsed ? styles.collapsedNavLink : ''}`}>
              <MessageCircleQuestion size={20} />
              {!sidebarCollapsed && (
                <>
                  <span>Assistant</span>
                  <Badge variant="secondary" className={styles.comingSoonBadge}>Soon</Badge>
                </>
              )}
            </NavLink>
          </nav>
                    <PortalQuickAccessList sidebarCollapsed={sidebarCollapsed} />
        </div>
        <Separator className={styles.separator} />
        <div className={styles.sidebarBottom}>
          <NavLink to={buildUrl('/admin/settings')} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''} ${sidebarCollapsed ? styles.collapsedNavLink : ''}`}>
            <Settings size={20} />
            {!sidebarCollapsed && <span>Settings</span>}
          </NavLink>
          <div className={`${styles.userControls} ${sidebarCollapsed ? styles.collapsedUserControls : ''}`}>
            <NotificationBell />
            {renderUserMenu()}
          </div>
        </div>

      </aside>
      <div className={styles.mainPanel}>
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};