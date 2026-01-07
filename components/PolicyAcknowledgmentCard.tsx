import React from 'react';
import { FileCheck, Clock } from 'lucide-react';
import { Button } from './Button';
import styles from './PolicyAcknowledgmentCard.module.css';

interface PolicyAcknowledgmentCardProps {
  policyTitle: string;
  isVisible: boolean;
  isAcknowledging?: boolean;
  onAcknowledge: () => void;
  onReviewLater?: () => void;
  className?: string;
}

export const PolicyAcknowledgmentCard: React.FC<PolicyAcknowledgmentCardProps> = ({
  policyTitle,
  isVisible,
  isAcknowledging = false,
  onAcknowledge,
  onReviewLater,
  className,
}) => {
  if (!isVisible) return null;

  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.header}>
        <FileCheck size={20} className={styles.icon} />
        <h3 className={styles.title}>Acknowledgment Required</h3>
      </div>
      
      <p className={styles.description}>
        By acknowledging, you confirm you have read and agree to comply with the <strong>{policyTitle}</strong>.
      </p>
      
      <p className={styles.notice}>
        Your acknowledgment will be recorded for compliance purposes.
      </p>
      
      <div className={styles.actions}>
        <Button 
          className={styles.acknowledgeButton}
          onClick={onAcknowledge}
          disabled={isAcknowledging}
        >
          <FileCheck size={18} />
          Acknowledge Policy
        </Button>
        
        {onReviewLater && (
          <Button 
            variant="ghost" 
            className={styles.reviewLaterButton}
            onClick={onReviewLater}
            disabled={isAcknowledging}
          >
            <Clock size={16} />
            Review Later
          </Button>
        )}
      </div>
    </div>
  );
};
