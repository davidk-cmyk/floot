import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePortals } from '../helpers/usePortalApi';
import { Button } from './Button';
import { PortalCard } from './PortalCard';
import { PortalForm } from './PortalForm';
import { Skeleton } from './Skeleton';
import styles from './PortalManager.module.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './Dialog';
import { OutputType as ListPortalsOutputType } from '../endpoints/portals/list_GET.schema';

export const PortalManager: React.FC<{ className?: string }> = ({ className }) => {
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const { data, isFetching, error } = usePortals({ page, limit: 10 });

  const renderSkeletons = () => (
    Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className={styles.skeletonCard}>
        <div className={styles.skeletonHeader}>
          <Skeleton style={{ height: '1.5rem', width: '40%' }} />
          <Skeleton style={{ height: '1.25rem', width: '20%' }} />
        </div>
        <Skeleton style={{ height: '1rem', width: '80%', marginTop: 'var(--spacing-2)' }} />
        <Skeleton style={{ height: '1rem', width: '60%', marginTop: 'var(--spacing-1)' }} />
        <div className={styles.skeletonFooter}>
          <Skeleton style={{ height: '2rem', width: '100px' }} />
          <Skeleton style={{ height: '2rem', width: '100px' }} />
        </div>
      </div>
    ))
  );

  const renderContent = () => {
    if (isFetching && !data) {
      return <div className={styles.portalGrid}>{renderSkeletons()}</div>;
    }

    if (error) {
      return <div className={styles.errorState}>Error loading portals: {error.message}</div>;
    }

    if (!data || data.portals.length === 0) {
      return <div className={styles.emptyState}>No portals found. Create one to get started.</div>;
    }

    return (
      <div className={styles.portalGrid}>
        {data.portals.map((portal) => (
          <PortalCard key={portal.id} portal={portal} />
        ))}
      </div>
    );
  };

  const renderPagination = (pagination: ListPortalsOutputType['pagination'] | undefined) => {
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
      <div className={styles.pagination}>
        <Button
          onClick={() => setPage(p => p - 1)}
          disabled={page === 1}
          variant="outline"
        >
          Previous
        </Button>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <Button
          onClick={() => setPage(p => p + 1)}
          disabled={page === pagination.totalPages}
          variant="outline"
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <div className={`${styles.managerContainer} ${className || ''}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.description}>
            Create and manage public or private portals to share specific sets of policies.
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} />
              Create New Portal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Portal</DialogTitle>
            </DialogHeader>
            <PortalForm onSuccess={() => setCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>
      
      {renderContent()}
      {renderPagination(data?.pagination)}
    </div>
  );
};