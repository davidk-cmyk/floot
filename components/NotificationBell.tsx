import React, { useState, useRef, useEffect } from "react";
import { Bell, BellDot } from "lucide-react";
import { useUnreadNotificationsCount } from "../helpers/useNotifications";
import { NotificationDropdown } from "./NotificationDropdown";
import styles from "./NotificationBell.module.css";

export const NotificationBell = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadCount, isFetching } = useUnreadNotificationsCount();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasUnread = unreadCount && unreadCount > 0;

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`${styles.container} ${className ?? ""}`}>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className={styles.bellButton}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Notifications (${unreadCount ?? 0} unread)`}
      >
        {hasUnread && !isFetching ? <BellDot /> : <Bell />}
        {hasUnread && !isFetching && (
          <span className={styles.badge}>{unreadCount}</span>
        )}
      </button>
      {isOpen && (
        <div ref={dropdownRef}>
          <NotificationDropdown onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
};