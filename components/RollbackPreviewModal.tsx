import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './Dialog';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';
import { PolicyVersionInfo } from '../endpoints/policies/versions_GET.schema';
import styles from './RollbackPreviewModal.module.css';

interface RollbackPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: PolicyVersionInfo | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const RollbackPreviewModal: React.FC<RollbackPreviewModalProps> = ({
  open,
  onOpenChange,
  version,
  onConfirm,
  isLoading = false,
}) => {
  if (!version) return null;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle>Rollback to Version {version.versionNumber}</DialogTitle>
        </DialogHeader>

        <div className={styles.contentContainer}>
          {/* Metadata Section */}
          <div className={styles.metadataSection}>
            <h3 className={styles.sectionTitle}>Version Details</h3>
            <div className={styles.metadataGrid}>
              <div className={styles.metadataItem}>
                <span className={styles.label}>Title:</span>
                <span className={styles.value}>{version.title}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.label}>Version Number:</span>
                <span className={styles.value}>{version.versionNumber}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.label}>Author:</span>
                <span className={styles.value}>{version.createdByDisplayName || 'System'}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.label}>Created:</span>
                <span className={styles.value}>
                  {version.createdAt ? new Date(version.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>

            {version.changeSummary && (
              <div className={styles.changeSummary}>
                <span className={styles.label}>Change Summary:</span>
                <p className={styles.summaryText}>{version.changeSummary}</p>
              </div>
            )}
          </div>

          {/* What Will Be Restored */}
          <div className={styles.contentSection}>
            <h3 className={styles.sectionTitle}>What Will Be Restored</h3>
            <p className={styles.infoText}>
              Rolling back will restore the policy title, content, metadata, and configuration from version {version.versionNumber}.
            </p>
            <ul className={styles.restoreList}>
              <li>Policy title and content</li>
              <li>Effective date and expiration date</li>
              <li>Department and category assignments</li>
              <li>Tags and policy status</li>
              <li>All other policy metadata</li>
            </ul>
          </div>

          {/* Warning Message */}
          <div className={styles.warningBox}>
            <AlertTriangle size={18} className={styles.warningIcon} />
            <div>
              <p className={styles.warningTitle}>This creates a new version</p>
              <p className={styles.warningText}>
                Rolling back will create a new version with the same content as version {version.versionNumber}. 
                The original version remains in history and can be rolled back to later if needed.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className={styles.footer}>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Rolling back...' : 'Confirm Rollback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
