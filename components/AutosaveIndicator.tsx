import React from 'react';
import { Check, Clock, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import styles from './AutosaveIndicator.module.css';

interface AutosaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
  lastSaved?: Date | undefined;
  className?: string;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  status,
  lastSaved,
  className,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Clock size={14} />,
          text: 'Saving...',
          className: styles.saving,
        };
      case 'saved':
        return {
          icon: <Check size={14} />,
          text: lastSaved ? `Saved ${formatRelativeTime(lastSaved)}` : 'Saved',
          className: styles.saved,
        };
      case 'error':
        return {
          icon: <AlertCircle size={14} />,
          text: 'Save failed',
          className: styles.error,
        };
      case 'offline':
        return {
          icon: <WifiOff size={14} />,
          text: 'Offline - changes saved locally',
          className: styles.offline,
        };
      default:
        return {
          icon: <Wifi size={14} />,
          text: 'Ready',
          className: styles.idle,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={`${styles.container} ${config.className} ${className || ''}`}
      role="status"
      aria-live="polite"
      aria-label={`Autosave status: ${config.text}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {config.icon}
      </span>
      <span className={styles.text}>
        {config.text}
      </span>
    </div>
  );
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}