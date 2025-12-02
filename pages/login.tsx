import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { PasswordLoginForm } from '../components/PasswordLoginForm';
import { ConditionalOAuthGroup } from '../components/ConditionalOAuthGroup';
import { useAuth } from '../helpers/useAuth';
import { useOrganization } from '../helpers/useOrganization';
import { Shield } from 'lucide-react';
import styles from './login.module.css';

const LoginPage = () => {
  const { authState } = useAuth();
  const { organizationState } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState.type === 'authenticated' && organizationState.type === 'active') {
      const orgId = organizationState.currentOrganization.id;
      navigate(`/${orgId}/admin/dashboard`, { replace: true });
    }
  }, [authState, organizationState, navigate]);

  return (
    <>
      <Helmet>
        <title>Login | MyPolicyPortal</title>
        <meta name="description" content="Log in to access MyPolicyPortal." />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <Shield className={styles.logoIcon} size={32} />
            <h1 className={styles.title}>Welcome to MyPolicyPortal</h1>
            <p className={styles.subtitle}>
              Sign in to continue
            </p>
          </div>

          <div className={styles.formContent}>
            <PasswordLoginForm />
            <ConditionalOAuthGroup />
          </div>

          <div className={styles.footer}>
            <p>
              By continuing, you agree to our{' '}
              <Link to="/terms" className={styles.link}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className={styles.link}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;