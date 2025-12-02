import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { Button } from './Button';
import styles from './PolicyAcknowledgmentBar.module.css';

interface PolicyAcknowledgmentBarProps {
  isVisible: boolean;
  isAcknowledging?: boolean;
  onAcknowledge: () => void;
  onRemindLater?: () => void;
  className?: string;
}

export const PolicyAcknowledgmentBar: React.FC<PolicyAcknowledgmentBarProps> = ({
  isVisible,
  isAcknowledging = false,
  onAcknowledge,
  onRemindLater,
  className,
}) => {
  if (!isVisible) return null;

  return (
    <div className={`${styles.bar} ${className || ''}`}>
      <div className={styles.content}>
        <div className={styles.messageSection}>
          <AlertTriangle size={20} className={styles.warningIcon} />
          <p className={styles.message}>
            You are required to acknowledge that you have read and understood this policy.
          </p>
        </div>
        <div className={styles.buttonGroup}>
          {onRemindLater && (
            <Button 
              variant="ghost" 
              onClick={onRemindLater}
              disabled={isAcknowledging}
            >
              Remind me later
            </Button>
          )}
          <Button 
            className={styles.acknowledgeButton}
            onClick={onAcknowledge}
            disabled={isAcknowledging}
          >
            <Check size={18} />
            I Acknowledge
          </Button>
        </div>
      </div>
    </div>
  );
};