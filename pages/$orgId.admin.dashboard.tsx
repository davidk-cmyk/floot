import React from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../helpers/useAuth';
import { useDashboardStats } from '../helpers/useDashboardApi';
import { useReviewStats } from '../helpers/usePolicyApi';
import { StatCard } from '../components/StatCard';
import { Skeleton } from '../components/Skeleton';
import { Book, CheckSquare, Calendar } from 'lucide-react';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { DashboardOnboarding } from '../components/DashboardOnboarding';
import { HandbookPromo } from '../components/HandbookPromo';
import styles from './$orgId.admin.dashboard.module.css';


const DashboardPage = () => {
  const { authState } = useAuth();
  const { data: stats, isFetching: isLoadingStats } = useDashboardStats();
  const { data: reviewStats, isFetching: isLoadingReviewStats } = useReviewStats();

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
              : `Welcome back, ${user?.displayName}!`
          }
          subtitle={
            isFirstTimeUser
              ? "Let's get you started. Follow the steps below to set up your policy management system."
              : "Here's your policy overview and key metrics at a glance."
          }
        />

        <DashboardOnboarding 
          stats={stats}
          isFirstTimeUser={isFirstTimeUser}
        />

        <div className={styles.statsGrid}>
          <StatCard
            title="Total Policies"
            value={stats?.totalPolicies ?? 0}
            icon={<Book size={24} />}
            isLoading={isLoadingStats}
          />
          <StatCard
            title="Due for Review"
            value={reviewStats?.totalDueForReview ?? 0}
            icon={<Calendar size={24} />}
            isLoading={isLoadingReviewStats}
          />
          <StatCard
            title="Require Acknowledgement"
            value={stats?.requiresAcknowledgement ?? 0}
            icon={<CheckSquare size={24} />}
            isLoading={isLoadingStats}
          />
        </div>

        <div className={styles.promoSection}>
          <HandbookPromo />
        </div>
      </div>
    </>
  );
};

export default DashboardPage;