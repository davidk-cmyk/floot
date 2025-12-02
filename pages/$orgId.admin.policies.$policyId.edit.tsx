import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PolicyUpdateForm } from '../components/PolicyUpdateForm';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/Breadcrumb';
import { usePolicyDetails } from '../helpers/usePolicyDetailsApi';
import { PolicyUpdateFormSkeleton } from '../components/PolicyUpdateFormSkeleton';
import { AlertCircle, Frown } from 'lucide-react';
import { useOrgNavigation } from '../helpers/useOrgNavigation';
import styles from './$orgId.admin.policies.$policyId.edit.module.css';

const EditPolicyPage = () => {
  const navigate = useNavigate();
  const { policyId: policyIdString } = useParams<{ policyId: string }>();
  const policyId = policyIdString ? parseInt(policyIdString, 10) : NaN;
  const { buildUrl } = useOrgNavigation();

  const {
    data: policyDetails,
    isFetching,
    isError,
    error,
  } = usePolicyDetails(policyId, {
    enabled: !isNaN(policyId),
  });

  const handleSuccess = () => {
    toast.success('Policy updated successfully!');
    navigate(buildUrl(`/admin/policies/${policyId}`));
  };

  const renderContent = () => {
    if (isNaN(policyId)) {
      return (
        <div className={styles.infoBox}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h2 className={styles.infoTitle}>Invalid Policy ID</h2>
          <p className={styles.infoMessage}>The policy ID in the URL is not valid.</p>
          <Link to={buildUrl('/admin/dashboard')} className={styles.infoLink}>
            Go to Dashboard
          </Link>
        </div>
      );
    }

    if (isFetching) {
      return <PolicyUpdateFormSkeleton />;
    }

    if (isError) {
      console.error("Failed to fetch policy details:", error);
      return (
        <div className={styles.infoBox}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h2 className={styles.infoTitle}>Error Loading Policy</h2>
          <p className={styles.infoMessage}>
            There was an error fetching the policy details. Please try again later.
          </p>
          <Link to={buildUrl('/admin/dashboard')} className={styles.infoLink}>
            Go to Dashboard
          </Link>
        </div>
      );
    }

    if (!policyDetails?.policy) {
      return (
        <div className={styles.infoBox}>
          <Frown size={48} className={styles.infoIcon} />
          <h2 className={styles.infoTitle}>Policy Not Found</h2>
          <p className={styles.infoMessage}>
            We couldn't find a policy with the ID "{policyId}".
          </p>
          <Link to={buildUrl('/admin/dashboard')} className={styles.infoLink}>
            Go to Dashboard
          </Link>
        </div>
      );
    }

    return <PolicyUpdateForm key={policyDetails.policy.id} policy={policyDetails.policy} onSuccess={handleSuccess} />;
  };

  const policyTitle = policyDetails?.policy?.title || 'Policy';

  return (
    <>
      <Helmet>
        <title>Edit {isFetching ? 'Policy' : policyTitle} - MyPolicyPortal</title>
        <meta name="description" content={`Edit the policy: ${policyTitle}`} />
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={buildUrl('/admin/dashboard')}>Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={buildUrl(`/admin/policies/${policyId}`)}>{isFetching ? 'Loading...' : policyTitle}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className={styles.main}>{renderContent()}</main>
      </div>
    </>
  );
};

export default EditPolicyPage;