import React, { useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { usePortals } from '../helpers/usePortalApi';
import { Checkbox } from './Checkbox';
import { Skeleton } from './Skeleton';
import styles from './PortalSelector.module.css';
import { Selectable } from 'kysely';
import { Portals } from '../helpers/schema';

interface PortalSelectorProps {
  /**
   * An array of IDs for the currently selected portals.
   */
  selectedPortalIds: number[];
  /**
   * Callback function invoked when the selection changes.
   */
  onPortalIdsChange: (portalIds: number[]) => void;
  /**
   * If true, the entire component will be disabled.
   */
  disabled?: boolean;
  /**
   * Optional CSS class for custom styling.
   */
  className?: string;
}

export const PortalSelector: React.FC<PortalSelectorProps> = ({
  selectedPortalIds,
  onPortalIdsChange,
  disabled = false,
  className,
}) => {
  const {
    data: portalsData,
    isFetching,
    error,
  } = usePortals({
    isActive: true,
        limit: 100, // Maximum limit allowed by the endpoint schema
  });

  const handleTogglePortal = useCallback(
    (portalId: number) => {
      const newSelectedIds = selectedPortalIds.includes(portalId)
        ? selectedPortalIds.filter((id) => id !== portalId)
        : [...selectedPortalIds, portalId];
      onPortalIdsChange(newSelectedIds);
    },
    [selectedPortalIds, onPortalIdsChange]
  );

  const renderContent = () => {
    if (isFetching) {
      return Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.skeletonItem}>
          <Skeleton style={{ height: '1.25rem', width: '1.25rem', borderRadius: 'var(--radius-sm)' }} />
          <Skeleton style={{ height: '1.25rem', width: '80%' }} />
        </div>
      ));
    }

    if (error) {
      return (
        <div className={styles.errorState}>
          <AlertTriangle className={styles.errorIcon} size={20} />
          <p>Could not load portals. Please try again later.</p>
        </div>
      );
    }

    if (!portalsData || portalsData.portals.length === 0) {
      return <div className={styles.emptyState}>No active portals found.</div>;
    }

    return portalsData.portals.map((portal: Selectable<Portals>) => (
      <label key={portal.id} className={styles.portalItem}>
        <Checkbox
          id={`portal-${portal.id}`}
          checked={selectedPortalIds.includes(portal.id)}
          onChange={() => handleTogglePortal(portal.id)}
          disabled={disabled}
        />
        <span className={styles.portalName}>{portal.name}</span>
      </label>
    ));
  };

  const totalPortals = portalsData?.portals?.length ?? 0;

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {!isFetching && !error && totalPortals > 0 && (
        <div className={styles.summary}>
          {selectedPortalIds.length} of {totalPortals} portals selected
        </div>
      )}
      <div className={styles.portalList}>{renderContent()}</div>
    </div>
  );
};