import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { PolicyContent } from './PolicyContent';
import { PolicyMetadata } from './PolicyMetadata';
import { DocumentView } from './DocumentView';
import { Skeleton } from './Skeleton';
import { PolicyWithAuthor } from '../endpoints/policies/get_POST.schema';
import { OutputType as DocumentLayoutSettings } from '../endpoints/document-layout_GET.schema';
import styles from './PolicyViewTabs.module.css';

type MetadataField = 'department' | 'category' | 'tags' | 'effectiveDate';

interface PolicyViewTabsProps {
  policy: PolicyWithAuthor;
  layoutSettings: DocumentLayoutSettings | undefined;
  isLayoutSettingsLoading: boolean;
  contentContainerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  showDocumentView?: boolean;
  hideMetadataFields?: MetadataField[];
}

export const PolicyViewTabs: React.FC<PolicyViewTabsProps> = ({
  policy,
  layoutSettings,
  isLayoutSettingsLoading,
  contentContainerRef,
  className,
  showDocumentView = true,
  hideMetadataFields,
}) => {
  // When there's only one view available, render without tabs
  if (!showDocumentView) {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <PolicyMetadata policy={policy} className={styles.metadata} hideFields={hideMetadataFields} />
        <PolicyContent policy={policy} contentContainerRef={contentContainerRef} />
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <Tabs defaultValue="document">
        <TabsList>
          <TabsTrigger value="document">Document View</TabsTrigger>
        </TabsList>
        <TabsContent value="document" className={styles.tabContent}>
          {isLayoutSettingsLoading && <DocumentViewSkeleton />}
          {layoutSettings && <DocumentView policy={policy} layoutSettings={layoutSettings} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const DocumentViewSkeleton: React.FC = () => (
  <div className={styles.skeletonContainer}>
    <div className={styles.skeletonPage}>
      <Skeleton style={{ height: '2rem', width: '60%', margin: '0 auto var(--spacing-8)' }} />
      <Skeleton style={{ height: '1.5rem', width: '80%', marginBottom: 'var(--spacing-4)' }} />
      <Skeleton style={{ height: '1rem', width: '100%', marginBottom: 'var(--spacing-2)' }} />
      <Skeleton style={{ height: '1rem', width: '100%', marginBottom: 'var(--spacing-2)' }} />
      <Skeleton style={{ height: '1rem', width: '70%', marginBottom: 'var(--spacing-8)' }} />
      <Skeleton style={{ height: '1rem', width: '100%', marginBottom: 'var(--spacing-2)' }} />
      <Skeleton style={{ height: '1rem', width: '100%', marginBottom: 'var(--spacing-2)' }} />
      <Skeleton style={{ height: '1rem', width: '100%', marginBottom: 'var(--spacing-2)' }} />
      <Skeleton style={{ height: '1rem', width: '40%', marginBottom: 'var(--spacing-4)' }} />
    </div>
  </div>
);