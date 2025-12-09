import React from 'react';
import { Helmet } from 'react-helmet';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { AssistantPromo } from '../components/AssistantPromo';
import styles from './$orgId.admin.assistant.module.css';

const AssistantPage = () => {
  return (
    <>
      <Helmet>
        <title>Policy Assistant | MyPolicyPortal</title>
      </Helmet>
      <div className={styles.container}>
        <DashboardPageHeader
          title="Policy Assistant"
          subtitle="AI-powered answers for your portal visitors"
        />
        <div className={styles.promoSection}>
          <AssistantPromo />
        </div>
      </div>
    </>
  );
};

export default AssistantPage;
