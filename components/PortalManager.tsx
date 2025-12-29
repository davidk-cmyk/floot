import React, { useState } from 'react';
import { Plus, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showUseCases, setShowUseCases] = useState(false);
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
        <p className={styles.description}>
          Create and manage public or private portals to share specific sets of policies.
        </p>
      </header>

      <div className={styles.infoBox}>
        <div className={styles.infoBoxHeader}>
          <Lightbulb size={18} className={styles.infoIcon} />
          <span className={styles.infoBoxTitle}>Quick Guide</span>
        </div>
        <p className={styles.infoBoxText}>
          Most organizations only need these two default portals. <strong>Public Portal</strong> for external audiences, <strong>Internal Portal</strong> for your team. Create additional portals only if you need to share different policy sets with specific groups.
        </p>
        <button 
          className={styles.useCasesToggle} 
          onClick={() => setShowUseCases(!showUseCases)}
        >
          {showUseCases ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          When to create additional portals
        </button>
        {showUseCases && (
          <ul className={styles.useCasesList}>
            <li>Regional offices with different local policies</li>
            <li>Partner portals with vendor-specific agreements</li>
            <li>Department-specific policy collections (HR, IT, Legal)</li>
            <li>Customer segments requiring different terms</li>
          </ul>
        )}
      </div>
      
      {renderContent()}
      {renderPagination(data?.pagination)}

      <div className={styles.createSection}>
        <p className={styles.createHelper}>Need a custom portal for a specific audience?</p>
        <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
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
      </div>
    </div>
  );
};