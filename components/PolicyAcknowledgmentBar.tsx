import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { Button } from './Button';
import styles from './PolicyAcknowledgmentBar.module.css';

interface PolicyAcknowledgmentBarProps {
  policyTitle?: string;
  isVisible: boolean;
  isAcknowledging?: boolean;
  onAcknowledge: () => void;
  onRemindLater?: () => void;
  className?: string;
}

export const PolicyAcknowledgmentBar: React.FC<PolicyAcknowledgmentBarProps> = ({
  policyTitle,
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
          <div className={styles.messageContent}>
            <p className={styles.messageTitle}>Acknowledgment Required</p>
            <p className={styles.message}>
              {policyTitle 
                ? `Confirm you have read and agree to comply with the ${policyTitle}.`
                : 'Confirm you have read and agree to comply with this policy.'}
            </p>
          </div>
        </div>
        <div className={styles.buttonGroup}>
          {onRemindLater && (
            <Button 
              variant="ghost" 
              onClick={onRemindLater}
              disabled={isAcknowledging}
            >
              Review Later
            </Button>
          )}
          <Button 
            className={styles.acknowledgeButton}
            onClick={onAcknowledge}
            disabled={isAcknowledging}
          >
            <Check size={18} />
            Acknowledge Policy
          </Button>
        </div>
      </div>
    </div>
  );
};