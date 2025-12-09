import React from 'react';
import { Helmet } from 'react-helmet';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { HandbookPromo } from '../components/HandbookPromo';
import styles from './$orgId.admin.handbook.module.css';

const HandbookPage = () => {
  return (
    <>
      <Helmet>
        <title>Handbook Generator | MyPolicyPortal</title>
      </Helmet>
      <div className={styles.container}>
        <DashboardPageHeader
          title="Handbook Generator"
          subtitle="Transform your policies into professional handbooks"
        />
        <div className={styles.promoSection}>
          <HandbookPromo />
        </div>
      </div>
    </>
  );
};

export default HandbookPage;
