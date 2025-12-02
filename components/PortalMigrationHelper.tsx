import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, Info, LoaderCircle } from 'lucide-react';

import { getPortalsMigrationStatus } from '../endpoints/portals/migration/status_GET.schema';
import { postPortalsMigrationStart } from '../endpoints/portals/migration/start_POST.schema';
import { Button } from './Button';
import { Progress } from './Progress';
import { Skeleton } from './Skeleton';
import styles from './PortalMigrationHelper.module.css';

const PORTAL_MIGRATION_STATUS_QUERY_KEY = 'portalMigrationStatus';

const usePortalMigrationStatus = () => {
  return useQuery({
    queryKey: [PORTAL_MIGRATION_STATUS_QUERY_KEY],
    queryFn: getPortalsMigrationStatus,
  });
};

const useStartPortalMigration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postPortalsMigrationStart,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: [PORTAL_MIGRATION_STATUS_QUERY_KEY] });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Migration failed: ${errorMessage}`);
      console.error('Portal migration error:', error);
    },
  });
};

const PortalMigrationHelperSkeleton = () => (
  <div className={styles.card}>
    <div className={styles.header}>
      <Skeleton style={{ height: '1.5rem', width: '200px' }} />
      <Skeleton style={{ height: '1rem', width: '300px', marginTop: 'var(--spacing-2)' }} />
    </div>
    <div className={styles.stats}>
      <Skeleton style={{ height: '1rem', width: '100%' }} />
      <Skeleton style={{ height: '0.5rem', width: '100%', marginTop: 'var(--spacing-2)' }} />
    </div>
    <div className={styles.details}>
      <Skeleton style={{ height: '1rem', width: '150px' }} />
      <Skeleton style={{ height: '1rem', width: '150px' }} />
    </div>
    <div className={styles.footer}>
      <Skeleton style={{ height: '2.5rem', width: '120px' }} />
    </div>
  </div>
);

export const PortalMigrationHelper = ({ className }: { className?: string }) => {
  const { data, isFetching, error } = usePortalMigrationStatus();
  const { mutate: startMigration, isPending: isMigrating } = useStartPortalMigration();

  if (isFetching) {
    return <PortalMigrationHelperSkeleton />;
  }

  if (error) {
    return (
      <div className={`${styles.card} ${styles.errorState} ${className ?? ''}`}>
        <AlertTriangle className={styles.icon} />
        <h4>Failed to load migration status</h4>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { totalPolicies, migratedPolicies, unmigratedPolicies, unmigratedPublic, unmigratedInternal } = data;
  const migrationProgress = totalPolicies > 0 ? (migratedPolicies / totalPolicies) * 100 : 100;
  const isComplete = unmigratedPolicies === 0;

  if (isComplete) {
    return (
      <div className={`${styles.card} ${styles.successState} ${className ?? ''}`}>
        <CheckCircle className={styles.icon} />
        <h4>Migration Complete</h4>
        <p>All policies have been successfully migrated to the new portal system.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <div className={styles.header}>
        <h4>Upgrade to the New Portal System</h4>
        <p>
          Migrate your policies from the legacy public/internal system to the more flexible portal architecture.
        </p>
      </div>

      <div className={styles.stats}>
        <div className={styles.progressHeader}>
          <span>
            <strong>{migratedPolicies}</strong> of <strong>{totalPolicies}</strong> policies migrated
          </span>
          <span>{migrationProgress.toFixed(0)}%</span>
        </div>
        <Progress value={migrationProgress} />
      </div>

      <div className={styles.details}>
        <div className={styles.detailItem}>
          <Info size={16} className={styles.infoIcon} />
          <span>
            <strong>{unmigratedPublic}</strong> public policies will be moved to a "Public Portal".
          </span>
        </div>
        <div className={styles.detailItem}>
          <Info size={16} className={styles.infoIcon} />
          <span>
            <strong>{unmigratedInternal}</strong> internal policies will be moved to an "Internal Portal".
          </span>
        </div>
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          This one-click process will create default portals if they don't exist and assign all remaining policies.
        </p>
        <Button onClick={() => startMigration({})} disabled={isMigrating}>
          {isMigrating && <LoaderCircle className={styles.spinner} size={16} />}
          {isMigrating ? 'Migrating...' : 'Migrate Now'}
        </Button>
      </div>
    </div>
  );
};