import React from 'react';
import { FileCheck, Clock, ShieldCheck } from 'lucide-react';
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
        <FileCheck size={18} className={styles.headerIcon} />
        <span className={styles.headerLabel}>Acknowledgment Required</span>
      </div>
      
      <div className={styles.policySection}>
        <p className={styles.policyLabel}>You are reviewing:</p>
        <h4 className={styles.policyTitle}>{policyTitle}</h4>
      </div>
      
      <div className={styles.complianceCapsule}>
        <ShieldCheck size={14} className={styles.complianceIcon} />
        <span className={styles.complianceText}>
          Your acknowledgment will be recorded for compliance purposes
        </span>
      </div>
      
      <div className={styles.actions}>
        <Button 
          className={styles.acknowledgeButton}
          onClick={onAcknowledge}
          disabled={isAcknowledging}
        >
          <FileCheck size={16} />
          Acknowledge Policy
        </Button>
        
        {onReviewLater && (
          <button 
            className={styles.reviewLaterLink}
            onClick={onReviewLater}
            disabled={isAcknowledging}
          >
            <Clock size={14} />
            Review Later
          </button>
        )}
      </div>
    </div>
  );
};
