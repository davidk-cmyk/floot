import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postMarkNotificationRead } from "../endpoints/notifications/mark-read_POST.schema";
import { NOTIFICATIONS_QUERY_KEY } from "../helpers/useNotifications";
import { Button } from "./Button";
import { Check, Trash2 } from "lucide-react";
import styles from "./NotificationActions.module.css";

interface NotificationActionsProps {
  selectedIds: number[];
  onActionComplete: () => void;
  onBulkAction?: (action: string, ids: number[]) => Promise<void>;
  isLoading?: boolean;
}

export const NotificationActions = ({
  selectedIds,
  onActionComplete,
  onBulkAction,
  isLoading = false,
}: NotificationActionsProps) => {
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    mutationFn: postMarkNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      onActionComplete();
    },
    onError: (error) => {
      console.error("Failed to mark notifications as read:", error);
      // You might want to show a toast notification here
    },
  });

  const handleMarkAsRead = async () => {
    if (selectedIds.length > 0) {
      if (onBulkAction) {
        await onBulkAction('markAsRead', selectedIds);
      } else {
        markReadMutation.mutate({ notificationIds: selectedIds });
      }
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className={styles.actionsContainer}>
      <span className={styles.selectionCount}>
        {selectedIds.length} selected
      </span>
      <div className={styles.buttonGroup}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleMarkAsRead}
          disabled={markReadMutation.isPending || isLoading}
        >
          <Check size={16} />
          Mark as read
        </Button>
        {/* 
          Delete functionality is omitted as there is no delete endpoint.
          This can be added back when an endpoint is available.
        <Button variant="destructive" size="sm" disabled>
          <Trash2 size={16} />
          Delete
        </Button> 
        */}
      </div>
    </div>
  );
};