import React from 'react';
import { Badge } from './Badge';
import { Separator } from './Separator';
import { Skeleton } from './Skeleton';
import styles from './PolicyVersionComparison.module.css';
import { usePolicyVersion } from '../helpers/usePolicyVersionControl';
import { stripHtmlTags } from '../helpers/stripHtmlTags';
import { Selectable } from 'kysely';
import { PolicyVersions } from '../helpers/schema';

interface PolicyVersionComparisonProps {
  policyId: number;
  versionA: number;
  versionB: number;
  className?: string;
}

const DiffViewer: React.FC<{ oldText: string; newText: string }> = ({ oldText, newText }) => {
  // Strip HTML tags for clean, readable comparison
  const cleanOldText = stripHtmlTags(oldText);
  const cleanNewText = stripHtmlTags(newText);

  return (
    <div className={styles.diffContainer}>
      <div className={styles.diffPane}>
        <pre className={styles.diffContent}>{cleanOldText}</pre>
      </div>
      <div className={styles.diffPane}>
        <pre className={styles.diffContent}>{cleanNewText}</pre>
      </div>
    </div>
  );
};

const MetadataItem: React.FC<{ label: string; valueA: React.ReactNode; valueB: React.ReactNode }> = ({ label, valueA, valueB }) => {
  const isDifferent = String(valueA) !== String(valueB);
  return (
    <div className={`${styles.metadataItem} ${isDifferent ? styles.different : ''}`}>
      <strong className={styles.metadataLabel}>{label}</strong>
      <div className={styles.metadataValue}>{valueA}</div>
      <div className={styles.metadataValue}>{valueB}</div>
    </div>
  );
};

const VersionComparisonSkeleton: React.FC = () => (
  <div className={styles.container}>
    <div className={styles.header}>
      <div className={styles.versionHeader}>
        <Skeleton className={styles.skeletonTitle} />
        <Skeleton className={styles.skeletonMeta} />
      </div>
      <div className={styles.versionHeader}>
        <Skeleton className={styles.skeletonTitle} />
        <Skeleton className={styles.skeletonMeta} />
      </div>
    </div>
    <Separator />
    <div className={styles.comparisonSection}>
      <Skeleton className={styles.skeletonSectionTitle} />
      <div className={styles.metadataGrid}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={styles.metadataItem}>
            <Skeleton className={styles.skeletonLabel} />
            <Skeleton className={styles.skeletonValue} />
            <Skeleton className={styles.skeletonValue} />
          </div>
        ))}
      </div>
    </div>
    <Separator />
    <div className={styles.comparisonSection}>
      <Skeleton className={styles.skeletonSectionTitle} />
      <div className={styles.diffContainer}>
        <div className={styles.diffPane}>
          <Skeleton className={styles.skeletonContent} />
        </div>
        <div className={styles.diffPane}>
          <Skeleton className={styles.skeletonContent} />
        </div>
      </div>
    </div>
  </div>
);

export const PolicyVersionComparison: React.FC<PolicyVersionComparisonProps> = ({ 
  policyId, 
  versionA, 
  versionB, 
  className 
}) => {
  const { 
    data: versionAData, 
    isFetching: isFetchingA, 
    error: errorA 
  } = usePolicyVersion({ 
    policyId, 
    versionNumber: versionA 
  });

  const { 
    data: versionBData, 
    isFetching: isFetchingB, 
    error: errorB 
  } = usePolicyVersion({ 
    policyId, 
    versionNumber: versionB 
  });

  const formatDate = (date: Date | string | null) => date ? new Date(date).toLocaleDateString() : 'N/A';

  // Show loading state while either version is loading
  if (isFetchingA || isFetchingB) {
    return <VersionComparisonSkeleton />;
  }

  // Handle errors
  if (errorA || errorB) {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.errorMessage}>
          Error loading version data: {errorA?.message || errorB?.message}
        </div>
      </div>
    );
  }

  // Handle missing data
  if (!versionAData || !versionBData) {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.errorMessage}>
          Version data not found
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <div className={styles.versionHeader}>
          <h4 className={styles.versionTitle}>Version {versionAData.versionNumber}</h4>
          <p className={styles.versionMeta}>Created on {formatDate(versionAData.createdAt)}</p>
        </div>
        <div className={styles.versionHeader}>
          <h4 className={styles.versionTitle}>Version {versionBData.versionNumber}</h4>
          <p className={styles.versionMeta}>Created on {formatDate(versionBData.createdAt)}</p>
        </div>
      </div>

      <Separator />

      <div className={styles.comparisonSection}>
        <h5 className={styles.sectionTitle}>Metadata</h5>
        <div className={styles.metadataGrid}>
          <MetadataItem label="Title" valueA={versionAData.title} valueB={versionBData.title} />
          <MetadataItem label="Status" valueA={<Badge>{versionAData.status}</Badge>} valueB={<Badge>{versionBData.status}</Badge>} />
          <MetadataItem label="Effective Date" valueA={formatDate(versionAData.effectiveDate)} valueB={formatDate(versionBData.effectiveDate)} />
          <MetadataItem label="Expiration Date" valueA={formatDate(versionAData.expirationDate)} valueB={formatDate(versionBData.expirationDate)} />
          <MetadataItem label="Department" valueA={versionAData.department || 'N/A'} valueB={versionBData.department || 'N/A'} />
          <MetadataItem label="Category" valueA={versionAData.category || 'N/A'} valueB={versionBData.category || 'N/A'} />

          <MetadataItem label="Requires Acknowledgment" valueA={versionAData.requiresAcknowledgment ? 'Yes' : 'No'} valueB={versionBData.requiresAcknowledgment ? 'Yes' : 'No'} />
          <MetadataItem label="Tags" valueA={versionAData.tags?.join(', ') || 'None'} valueB={versionBData.tags?.join(', ') || 'None'} />
        </div>
      </div>

      <Separator />

      <div className={styles.comparisonSection}>
        <h5 className={styles.sectionTitle}>Content</h5>
        <DiffViewer oldText={versionAData.content} newText={versionBData.content} />
      </div>
    </div>
  );
};