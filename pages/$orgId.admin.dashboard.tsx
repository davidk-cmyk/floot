import React from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../helpers/useAuth';
import { useDashboardStats } from '../helpers/useDashboardApi';
import { useOrgNavigation } from '../helpers/useOrgNavigation';
import { Settings, FileText, Send, Globe } from 'lucide-react';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { QuickActionCard } from '../components/QuickActionCard';
import styles from './$orgId.admin.dashboard.module.css';


const DashboardPage = () => {
  const { authState } = useAuth();
  const { data: stats } = useDashboardStats();
  const { buildUrl } = useOrgNavigation();

  const user = authState.type === 'authenticated' ? authState.user : null;
  const isFirstLogin = authState.type === 'authenticated' ? authState.isFirstLogin : false;

  // Determine if this is a first-time user based on isFirstLogin flag OR no policies exist
  const isFirstTimeUser = isFirstLogin || (stats?.totalPolicies === 0);

  return (
    <>
      <Helmet>
        <title>Dashboard | MyPolicyPortal</title>
      </Helmet>
      <div className={styles.container}>
        <DashboardPageHeader
          title={
            isFirstTimeUser
              ? `Welcome to MyPolicyPortal, ${user?.displayName ?? 'User'}!`
              : `Welcome Back, ${user?.displayName}!`
          }
          subtitle={
            isFirstTimeUser
              ? "Let's get you started. Follow the steps below to set up your policy management system."
              : "Here's your policy overview and key metrics at a glance."
          }
        />

        <section className={styles.quickActionsSection}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.quickActionsGrid}>
            <QuickActionCard
              icon={<Settings />}
              title="Configure"
              description="Customize your organization settings, branding, and portal configuration."
              buttonText="Go to Settings"
              to={buildUrl('/admin/settings')}
              color="coral"
            />
            <QuickActionCard
              icon={<FileText />}
              title="Create & Publish Policy"
              description="Draft a new policy using our AI assistant or upload your existing documents."
              buttonText="Draft Policy"
              to={buildUrl('/admin/policies/new')}
              color="blue"
            />
            <QuickActionCard
              icon={<Send />}
              title="Send for Review"
              description="Track user acknowledgements, view pending tasks, and copy portal links to share."
              buttonText="View Acknowledgements"
              to={buildUrl('/admin/acknowledgements')}
              color="purple"
            />
          </div>
        </section>

        <section className={styles.portalsSection}>
          <div className={styles.quickActionsGrid} style={{ gridTemplateColumns: '1fr' }}>
            <QuickActionCard
              icon={<Globe />}
              title="View Your Portals"
              description="Preview and manage your Internal and Public portals where policies are published."
              buttonText="Go to Portals"
              to={buildUrl('/admin/settings#portals')}
              color="green"
            />
          </div>
        </section>
      </div>
    </>
  );
};

export default DashboardPage;