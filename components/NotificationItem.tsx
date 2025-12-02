import React from "react";
import { Link } from "react-router-dom";
import { Selectable } from "kysely";
import { Notifications } from "../helpers/schema";
import { useMarkNotificationRead } from "../helpers/useNotifications";
import { useOrgNavigation } from "../helpers/useOrgNavigation";
import { formatDistanceToNow } from "../helpers/dateHelpers";
import {
  FileText,
  BellRing,
  FileClock,
  AlertTriangle,
  Info,
} from "lucide-react";
import styles from "./NotificationItem.module.css";

interface NotificationItemProps {
  notification: Selectable<Notifications>;
  onClose: () => void;
}

const NOTIFICATION_TYPE_CONFIG = {
  policy_assignment: {
    icon: FileText,
    color: "var(--info)",
  },
  acknowledgement_reminder: {
    icon: BellRing,
    color: "var(--warning)",
  },
  policy_update: {
    icon: FileClock,
    color: "var(--primary)",
  },
  default: {
    icon: Info,
    color: "var(--secondary)",
  },
};

export const NotificationItem = ({
  notification,
  onClose,
}: NotificationItemProps) => {
  const { navigateToAdmin, buildUrl } = useOrgNavigation();
  const markReadMutation = useMarkNotificationRead();

  const config =
    NOTIFICATION_TYPE_CONFIG[
      notification.type as keyof typeof NOTIFICATION_TYPE_CONFIG
    ] || NOTIFICATION_TYPE_CONFIG.default;
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.isRead) {
      markReadMutation.mutate(
        { notificationIds: [notification.id] },
        {
          onSuccess: () => {
            if (notification.relatedPolicyId) {
              navigateToAdmin(`/policies/${notification.relatedPolicyId}`);
            }
          },
        }
      );
    } else if (notification.relatedPolicyId) {
      navigateToAdmin(`/policies/${notification.relatedPolicyId}`);
    }
    onClose();
  };

  const itemClasses = [
    styles.item,
    notification.isRead ? "" : styles.unread,
    notification.relatedPolicyId ? styles.clickable : "",
  ].join(" ");

  const content = (
    <>
      <div className={styles.iconWrapper} style={{ color: config.color }}>
        <Icon size={20} />
      </div>
      <div className={styles.content}>
        <p className={styles.title}>{notification.title}</p>
        <p className={styles.message}>{notification.message}</p>
        <p className={styles.timestamp}>
          {formatDistanceToNow(new Date(notification.createdAt!))}
        </p>
      </div>
      {!notification.isRead && <div className={styles.unreadDot} />}
    </>
  );

  return notification.relatedPolicyId ? (
    <Link
      to={buildUrl(`/admin/policies/${notification.relatedPolicyId}`)}
      onClick={(e) => {
        e.preventDefault();
        handleClick();
      }}
      className={itemClasses}
    >
      {content}
    </Link>
  ) : (
    <div className={itemClasses}>{content}</div>
  );
};