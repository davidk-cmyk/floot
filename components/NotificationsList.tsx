import React from "react";
import { Link } from "react-router-dom";
import { Inbox, AlertCircle } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import { Checkbox } from "./Checkbox";
import { Skeleton } from "./Skeleton";
import { Button } from "./Button";
import { OutputType as ListOutputType } from "../endpoints/notifications/list_GET.schema";
import styles from "./NotificationsList.module.css";

type Notification = ListOutputType["notifications"][0];

interface NotificationsListProps {
  notifications: Notification[];
  isLoading: boolean;
  error: unknown;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  selectedIds: Set<number>;
  onSelectAll: (isChecked: boolean) => void;
  onSelectOne: (id: number, isChecked: boolean) => void;
}

export const NotificationsList = ({
  notifications,
  isLoading,
  error,
  pagination,
  selectedIds,
  onSelectAll,
  onSelectOne,
}: NotificationsListProps) => {
  const { currentPage, totalPages, totalItems, onPageChange } = pagination;

  const renderSkeletons = () => (
    <>
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className={styles.skeletonItem}>
          <Skeleton style={{ width: '1.25rem', height: '1.25rem', borderRadius: 'var(--radius-sm)' }} />
          <div className={styles.skeletonContent}>
            <Skeleton style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-full)' }} />
            <div className={styles.skeletonText}>
              <Skeleton style={{ width: '60%', height: '1rem' }} />
              <Skeleton style={{ width: '80%', height: '0.875rem' }} />
            </div>
          </div>
        </div>
      ))}
    </>
  );

  if (isLoading) {
    return (
      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <Skeleton style={{ width: '1.25rem', height: '1.25rem', borderRadius: 'var(--radius-sm)' }} />
          <Skeleton style={{ width: '120px', height: '1rem' }} />
        </div>
        <div className={styles.list}>{renderSkeletons()}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.emptyState}>
        <AlertCircle size={48} className={styles.errorIcon} />
        <h3 className={styles.emptyTitle}>Something went wrong</h3>
        <p className={styles.emptyText}>
          We couldn't load your notifications. Please try again later.
        </p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Inbox size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>No notifications found</h3>
        <p className={styles.emptyText}>
          There are no notifications matching your current filters.
        </p>
      </div>
    );
  }

  const isAllSelected = notifications.length > 0 && selectedIds.size === notifications.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < notifications.length;

  // Keyboard navigation for pagination
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft' && currentPage > 1) {
      onPageChange(currentPage - 1);
    } else if (event.key === 'ArrowRight' && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={styles.listContainer} onKeyDown={handleKeyDown}>
      <div className={styles.listHeader}>
        <Checkbox
          checked={isAllSelected}
          onChange={(event) => onSelectAll(event.target.checked)}
          aria-label="Select all notifications on this page"
          data-state={isSomeSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
        />
        <span>{totalItems} notifications</span>
      </div>
      <div className={styles.list}>
        {notifications.map((notification) => (
          <div key={notification.id} className={styles.notificationRow}>
            <Checkbox
              checked={selectedIds.has(notification.id)}
              onChange={(event) => onSelectOne(notification.id, event.target.checked)}
              aria-labelledby={`notification-title-${notification.id}`}
            />
            <div className={styles.notificationItemWrapper}>
              <NotificationItem notification={notification} onClose={() => {}} />
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            Previous
          </Button>
          <span aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};