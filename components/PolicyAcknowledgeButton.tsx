import React, { useState } from 'react';
import { Check, CheckCircle, Loader2, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from './Dialog';
import { Progress } from './Progress';
import styles from './PolicyAcknowledgeButton.module.css';

interface PolicyAcknowledgeButtonProps {
  /**
   * Whether the policy has already been acknowledged by the user.
   */
  isAcknowledged: boolean;
  /**
   * The date and time when the policy was acknowledged.
   * Only relevant when isAcknowledged is true.
   */
  acknowledgedAt?: Date | null;
  /**
   * Whether the acknowledgment mutation is in progress.
   */
  isAcknowledging: boolean;
  /**
   * A callback function to be executed when the user confirms acknowledgment.
   */
  onAcknowledge: () => void;
  /**
   * Whether the user has met the minimum requirements (e.g., reading time) to acknowledge.
   * Defaults to true.
   */
  isReadyToAcknowledge?: boolean;
  /**
   * The reading progress percentage (0-100).
   * Only relevant if `isReadyToAcknowledge` is false.
   */
  readingProgress?: number;
  /**
   * If true, the component will take up the full width of its container.
   */
  fullWidth?: boolean;
  /**
   * Optional additional class names.
   */
  className?: string;
}

export const PolicyAcknowledgeButton: React.FC<PolicyAcknowledgeButtonProps> = ({
  isAcknowledged,
  isAcknowledging,
  onAcknowledge,
  isReadyToAcknowledge = true,
  readingProgress = 0,
  fullWidth = false,
  className,
  acknowledgedAt,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConfirm = () => {
    onAcknowledge();
    setIsDialogOpen(false);
  };

  const containerClasses = [
    styles.container,
    fullWidth ? styles.fullWidth : '',
    className || '',
  ].join(' ').trim();

  if (isAcknowledged) {
    return (
      <div className={containerClasses}>
        <Button size="lg" disabled className={styles.acknowledgedButton}>
          <CheckCircle size={20} />
          Acknowledged
        </Button>
        {acknowledgedAt && (
          <p className={styles.acknowledgedTimestamp}>
            Acknowledged on {format(acknowledgedAt, 'MMMM d, yyyy')} at {format(acknowledgedAt, 'h:mm a')}
          </p>
        )}
      </div>
    );
  }

  if (!isReadyToAcknowledge) {
    return (
      <div className={containerClasses}>
        <div className={styles.progressContainer}>
          <p className={styles.progressLabel}>Minimum reading time required</p>
          <Progress value={readingProgress} />
          <span className={styles.progressPercentage}>{Math.round(readingProgress)}%</span>
        </div>
        <Button size="lg" disabled>
          Acknowledge Reading
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <div className={containerClasses}>
          <Button variant="primary" size="lg" disabled={isAcknowledging}>
            {isAcknowledging ? (
              <>
                <Loader2 size={20} className={styles.spinner} />
                Acknowledging...
              </>
            ) : (
              <>
                <Check size={20} />
                Acknowledge Reading
              </>
            )}
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <ShieldAlert size={24} className={styles.dialogIcon} />
            Confirm Acknowledgment
          </DialogTitle>
          <DialogDescription>
            By clicking "Confirm," you are formally acknowledging that you have read, understood, and agree to comply with this policy. This action is recorded and serves as your digital signature.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={isAcknowledging}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isAcknowledging}>
            {isAcknowledging ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                Confirming...
              </>
            ) : (
              'Confirm & Acknowledge'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};