import React from "react";
import { Link } from "react-router-dom";
import {
  useNotificationsList,
  useMarkAllNotificationsRead,
} from "../helpers/useNotifications";
import { useOrgNavigation } from "../helpers/useOrgNavigation";
import { NotificationItem } from "./NotificationItem";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { Separator } from "./Separator";
import { Inbox } from "lucide-react";
import styles from "./NotificationDropdown.module.css";

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown = ({ onClose }: NotificationDropdownProps) => {
  const { buildUrl } = useOrgNavigation();
  const {
    data,
    isFetching: isLoading,
    error,
  } = useNotificationsList({ 
    limit: 20, 
    page: 1, 
    status: "all",
    sortBy: "date",
    sortOrder: "desc"
  });
  const markAllReadMutation = useMarkAllNotificationsRead();

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate({});
  };

  const notifications = data?.notifications ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={styles.list}>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={styles.skeletonItem}>
              <Skeleton style={{ width: "2rem", height: "2rem", borderRadius: "var(--radius-full)" }} />
              <div className={styles.skeletonText}>
                <Skeleton style={{ width: "80%", height: "1rem" }} />
                <Skeleton style={{ width: "60%", height: "0.875rem" }} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.emptyState}>
          <p>Could not load notifications.</p>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className={styles.emptyState}>
          <Inbox size={48} className={styles.emptyIcon} />
          <h4 className={styles.emptyTitle}>No notifications</h4>
          <p className={styles.emptyText}>You're all caught up!</p>
        </div>
      );
    }

    return (
      <div className={styles.list}>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={onClose}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.dropdown}>
      <header className={styles.header}>
        <h3 className={styles.title}>Notifications</h3>
        <Button
          variant="link"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={markAllReadMutation.isPending || !hasUnread}
        >
          Mark all as read
        </Button>
      </header>
      <Separator />
      {renderContent()}
      <Separator />
      <footer className={styles.footer}>
        <Button asChild variant="outline" size="sm" className={styles.viewAllButton}>
          <Link to={buildUrl('/admin/notifications')} onClick={onClose}>
            View all notifications
          </Link>
        </Button>
      </footer>
    </div>
  );
};