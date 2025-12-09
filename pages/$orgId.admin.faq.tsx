import React from 'react';
import { Helmet } from 'react-helmet';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { FaqPromo } from '../components/FaqPromo';
import styles from './$orgId.admin.faq.module.css';

const FaqPage = () => {
  return (
    <>
      <Helmet>
        <title>FAQ Generator | MyPolicyPortal</title>
      </Helmet>
      <div className={styles.container}>
        <DashboardPageHeader
          title="FAQ Generator"
          subtitle="Turn your policies into searchable Q&A"
        />
        <div className={styles.promoSection}>
          <FaqPromo />
        </div>
      </div>
    </>
  );
};

export default FaqPage;
