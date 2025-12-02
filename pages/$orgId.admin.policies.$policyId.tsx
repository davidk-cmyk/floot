import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../helpers/useAuth';
import { usePolicyDetails } from '../helpers/usePolicyDetailsApi';
import { Skeleton } from '../components/Skeleton';
import { AlertTriangle, Info } from 'lucide-react';
import { PolicyHeader } from '../components/PolicyHeader';
import { PolicyViewTabs } from '../components/PolicyViewTabs';
import { PolicySidebar } from '../components/PolicySidebar';
import { PolicyDownloadButton } from '../components/PolicyDownloadButton';
import { useDocumentLayout } from '../helpers/useDocumentLayoutApi';
import { useOrgNavigation } from '../helpers/useOrgNavigation';
import styles from './$orgId.admin.policies.$policyId.module.css';

const PolicyDetailPage = () => {
  const { policyId } = useParams<{ policyId: string }>();
  const numericPolicyId = policyId ? parseInt(policyId, 10) : NaN;
  
  // We import useOrgNavigation to ensure context is available if needed by children or future extensions
  const { buildUrl } = useOrgNavigation();

  const { authState } = useAuth();
  const { data, isFetching, error } = usePolicyDetails(numericPolicyId, {
    enabled: !isNaN(numericPolicyId) && authState.type === 'authenticated',
  });

  const { data: layoutSettings, isFetching: isLayoutSettingsLoading } = useDocumentLayout();
  const contentContainerRef = useRef<HTMLDivElement>(null);

  if (isNaN(numericPolicyId)) {
    return (
      <div className={styles.errorContainer}>
        <AlertTriangle size={48} />
        <h1>Invalid Policy ID</h1>
        <p>The policy ID in the URL is not valid.</p>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className={styles.container}>
        <div className={styles.mainContent}>
          <Skeleton style={{ height: '4rem', width: '70%', marginBottom: '1rem' }} />
          <Skeleton style={{ height: '1.5rem', width: '30%', marginBottom: '2rem' }} />
          <Skeleton style={{ height: '20rem' }} />
        </div>
        <div className={styles.sidebar}>
          <Skeleton style={{ height: '15rem' }} />
          <Skeleton style={{ height: '10rem', marginTop: '2rem' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertTriangle size={48} />
        <h1>Error Loading Policy</h1>
        <p>{error instanceof Error ? error.message : 'An unknown error occurred.'}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.errorContainer}>
        <Info size={48} />
        <h1>Policy Not Found</h1>
        <p>The requested policy could not be found or you do not have permission to view it.</p>
      </div>
    );
  }

  const { policy, currentUserStatus, adminView, versions } = data;
  const user = authState.type === 'authenticated' ? authState.user : null;

  return (
    <>
      <Helmet>
        <title>{`${policy.title} | MyPolicyPortal`}</title>
      </Helmet>
      <div className={styles.container}>
        <div className={styles.mainContent} ref={contentContainerRef}>
          <PolicyHeader policy={policy} />
          <PolicyViewTabs 
            policy={policy}
            layoutSettings={layoutSettings}
            isLayoutSettingsLoading={isLayoutSettingsLoading}
            contentContainerRef={contentContainerRef}
          />
        </div>
        <div className={styles.sidebar}>
          <PolicyDownloadButton 
            policyId={policy.id}
            policyTitle={policy.title}
            className={styles.downloadButton}
          />
          <PolicySidebar
            policy={policy}
            currentUserStatus={currentUserStatus}
            adminView={adminView}
            versions={versions}
            user={user}
          />
        </div>
      </div>
    </>
  );
};

export default PolicyDetailPage;