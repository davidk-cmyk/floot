import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, Plus, Settings } from 'lucide-react';
import { useAuth } from '../helpers/useAuth';
import { useOrgNavigation } from '../helpers/useOrgNavigation';
import { usePortals } from '../helpers/usePortalApi';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { PortalQuickAccessItem } from './PortalQuickAccessItem';
import styles from './PortalQuickAccessList.module.css';

interface PortalQuickAccessListProps {
  sidebarCollapsed?: boolean;
}

export const PortalQuickAccessList: React.FC<PortalQuickAccessListProps> = ({ sidebarCollapsed }) => {
  const { authState } = useAuth();
  const { buildUrl } = useOrgNavigation();
  const { data, isFetching, isError, refetch } = usePortals({ page: 1, limit: 20 });

  if (sidebarCollapsed) {
    return null;
  }

  if (authState.type !== 'authenticated' || authState.user.role !== 'admin') {
    return null;
  }

  const renderContent = () => {
    if (isFetching) {
      return (
        <>
          <Skeleton className={styles.skeletonItem} />
          <Skeleton className={styles.skeletonItem} />
          <Skeleton className={styles.skeletonItem} />
        </>
      );
    }

    if (isError) {
      return (
        <div className={styles.stateContainer}>
          <p className={styles.stateText}>Failed to load portals.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      );
    }

    if (!data || data.portals.length === 0) {
      return (
        <div className={styles.stateContainer}>
          <p className={styles.stateText}>No portals have been created yet.</p>
          <Button asChild variant="secondary" size="sm">
            <Link to={buildUrl('/admin/settings/portals')}>
              <Plus size={16} />
              Create Portal
            </Link>
          </Button>
        </div>
      );
    }

    const sortedPortals = [...data.portals].sort((a, b) => a.name.localeCompare(b.name));

    return sortedPortals.map((portal) => (
      <PortalQuickAccessItem key={portal.id} portal={portal} />
    ));
  };

  return (
    <div className={styles.container}>
      <Link to={buildUrl('/admin/settings/portals')} className={styles.headerLink}>
        <h3 className={styles.header}>
          <Folder size={16} />
          <span>Portals</span>
          <Settings size={16} />
        </h3>
      </Link>
      <div className={styles.list}>
        {renderContent()}
      </div>
    </div>
  );
};