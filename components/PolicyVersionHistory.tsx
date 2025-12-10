import React, { useState } from 'react';
import { usePolicyVersions, useRollbackPolicy } from '../helpers/usePolicyVersionControl';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { Badge } from './Badge';
import { AlertTriangle, CheckCircle, GitCommit, History, GitCompareArrows, Eye, RotateCcw } from 'lucide-react';
import styles from './PolicyVersionHistory.module.css';
import { PolicyVersionComparison } from './PolicyVersionComparison';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './Dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';
import { PolicyVersionInfo } from '../endpoints/policies/versions_GET.schema';
import { RollbackPreviewModal } from './RollbackPreviewModal';

interface PolicyVersionHistoryProps {
  policyId: number;
  className?: string;
}

const PolicyVersionHistorySkeleton = () => (
  <div className={styles.container}>
    <div className={styles.skeletonHeader}>
      <Skeleton style={{ height: '2rem', width: '150px' }} />
    </div>
    <div className={styles.versionList}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={styles.versionItem}>
          <div className={styles.versionIcon}>
            <Skeleton style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
          </div>
          <div className={styles.versionDetails}>
            <Skeleton style={{ height: '1.25rem', width: '70%' }} />
            <Skeleton style={{ height: '1rem', width: '50%' }} />
          </div>
          <div className={styles.versionActions}>
            <Skeleton style={{ height: '2rem', width: '80px' }} />
            <Skeleton style={{ height: '2rem', width: '80px' }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const PolicyVersionHistory: React.FC<PolicyVersionHistoryProps> = ({ policyId, className }) => {
  const [compareVersions, setCompareVersions] = useState<[PolicyVersionInfo, PolicyVersionInfo] | null>(null);
  const [selectedToCompare, setSelectedToCompare] = useState<PolicyVersionInfo | null>(null);
  const [rollbackPreviewVersion, setRollbackPreviewVersion] = useState<PolicyVersionInfo | null>(null);

  const { data: versions, isFetching, error } = usePolicyVersions({ policyId });
  const { mutate: rollback, isPending: isRollingBack } = useRollbackPolicy();

  const handleRollback = (version: PolicyVersionInfo) => {
    setRollbackPreviewVersion(version);
  };

  const handleConfirmRollback = () => {
    if (rollbackPreviewVersion) {
      rollback({ policyId, versionNumber: rollbackPreviewVersion.versionNumber });
      setRollbackPreviewVersion(null);
    }
  };

  const handleSelectForCompare = (version: PolicyVersionInfo) => {
    if (selectedToCompare) {
      if (selectedToCompare.id !== version.id) {
        // Order versions by version number
        const orderedVersions = [selectedToCompare, version].sort((a, b) => a.versionNumber - b.versionNumber) as [PolicyVersionInfo, PolicyVersionInfo];
        setCompareVersions(orderedVersions);
      }
      setSelectedToCompare(null);
    } else {
      setSelectedToCompare(version);
    }
  };

  const handleCloseComparison = () => {
    setCompareVersions(null);
  };

  if (isFetching) {
    return <PolicyVersionHistorySkeleton />;
  }

  if (error) {
    return (
      <div className={`${styles.container} ${styles.errorState} ${className || ''}`}>
        <AlertTriangle className={styles.errorIcon} />
        <p>Error loading version history: {error.message}</p>
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className={`${styles.container} ${styles.emptyState} ${className || ''}`}>
        <History className={styles.emptyIcon} />
        <p>No version history available for this policy.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <ul className={styles.versionList}>
        {versions.map((version, index) => (
          <li key={version.id} className={styles.versionItem}>
            <div className={styles.versionIcon}>
              <GitCommit size={24} />
            </div>
            <div className={styles.versionDetails}>
              <div className={styles.versionTitle}>
                <span className={styles.versionNumber}>Version {version.versionNumber}</span>
                {index === 0 && <Badge variant="success">Current</Badge>}
              </div>
              <p className={styles.versionMeta}>
                By {version.createdByDisplayName || 'System'} on {version.createdAt ? new Date(version.createdAt).toLocaleDateString() : 'Unknown date'}
              </p>
              {version.changeSummary && <p className={styles.changeSummary}>{version.changeSummary}</p>}
            </div>
            <div className={styles.versionActions}>
              <Dialog>
                <DialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon-sm">
                        <Eye size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View version details</TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent className={styles.dialogContent}>
                  <DialogHeader>
                    <DialogTitle>Version {version.versionNumber}: {version.title}</DialogTitle>
                  </DialogHeader>
                  <div className={styles.versionContentPreview}>
                    <p><strong>Title:</strong> {version.title}</p>
                    {version.changeSummary && <p><strong>Change Summary:</strong> {version.changeSummary}</p>}
                    <p><strong>Created:</strong> {version.createdAt ? new Date(version.createdAt).toLocaleDateString() : 'Unknown date'}</p>
                    <p><strong>Author:</strong> {version.createdByDisplayName || 'System'}</p>
                  </div>
                </DialogContent>
              </Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => handleSelectForCompare(version)}
                    disabled={selectedToCompare?.id === version.id}
                  >
                    {selectedToCompare ? <CheckCircle size={16} /> : <GitCompareArrows size={16} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {selectedToCompare ? 'Select to compare versions' : 'Select version for comparison'}
                </TooltipContent>
              </Tooltip>
              {index !== 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      onClick={() => handleRollback(version)}
                      disabled={isRollingBack}
                    >
                      <RotateCcw size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rollback to this version</TooltipContent>
                </Tooltip>
              )}
            </div>
          </li>
        ))}
      </ul>
      {compareVersions && (
        <Dialog open={!!compareVersions} onOpenChange={(open) => !open && handleCloseComparison()}>
          <DialogContent className={styles.dialogContentLarge}>
            <DialogHeader>
              <DialogTitle>Comparing Versions</DialogTitle>
            </DialogHeader>
            <PolicyVersionComparison
              policyId={policyId}
              versionA={compareVersions[0].versionNumber}
              versionB={compareVersions[1].versionNumber}
            />
          </DialogContent>
        </Dialog>
      )}
      <RollbackPreviewModal
        open={!!rollbackPreviewVersion}
        onOpenChange={(open) => !open && setRollbackPreviewVersion(null)}
        version={rollbackPreviewVersion}
        onConfirm={handleConfirmRollback}
        isLoading={isRollingBack}
      />
    </div>
  );
};