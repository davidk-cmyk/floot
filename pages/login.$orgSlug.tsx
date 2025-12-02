import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../helpers/useAuth';
import { useOrganization } from '../helpers/useOrganization';
import { useOrganizationBySlug } from '../helpers/useOrganizationApi';
import { PasswordLoginForm } from '../components/PasswordLoginForm';
import { ConditionalOAuthGroup } from '../components/ConditionalOAuthGroup';
import { Skeleton } from '../components/Skeleton';
import styles from './login.$orgSlug.module.css';

const OrgLoginPage = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { authState } = useAuth();
  const { organizationState } = useOrganization();
  const navigate = useNavigate();

  const { data: organization, isLoading, isError } = useOrganizationBySlug(orgSlug);

  useEffect(() => {
    if (authState.type === 'authenticated' && organizationState.type === 'active') {
      const orgId = organizationState.currentOrganization.id;
      navigate(`/${orgId}/admin/dashboard`, { replace: true });
    } else if (authState.type === 'authenticated' && organizationState.type === 'no-organization') {
      navigate('/organizations', { replace: true });
    }
  }, [authState, organizationState, navigate]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <Skeleton style={{ width: '32px', height: '32px', margin: '0 auto var(--spacing-4)' }} />
            <Skeleton style={{ width: '80%', height: '1.75rem', margin: '0 auto' }} />
            <Skeleton style={{ width: '60%', height: '1rem', marginTop: 'var(--spacing-2)', margin: 'var(--spacing-2) auto 0' }} />
          </div>
          <Skeleton style={{ width: '100%', height: '200px' }} />
        </div>
      </div>
    );
  }

  if (isError || !organization) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <AlertTriangle className={styles.errorIcon} size={48} />
          <h1 className={styles.title}>Organization Not Found</h1>
          <p className={styles.subtitle}>
            The organization at this URL could not be found. Please check the address and try again.
          </p>
          <Link to="/login" className={styles.link}>
            Return to main login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Login to {organization.name} | MyPolicyPortal</title>
        <meta name="description" content={`Log in to your ${organization.name} account on MyPolicyPortal.`} />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <Shield className={styles.logoIcon} size={32} />
            <h1 className={styles.title}>Welcome to {organization.name}</h1>
            <p className={styles.subtitle}>Sign in to your account to continue</p>
          </div>

          <div className={styles.formContainer}>
            <PasswordLoginForm organizationId={organization.id} />
            <ConditionalOAuthGroup />
          </div>

          <div className={styles.footer}>
            <p>
              Not part of {organization.name}?{' '}
              <Link to="/login" className={styles.link}>
                Go to general login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrgLoginPage;