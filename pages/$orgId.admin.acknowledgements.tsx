import React from 'react';
import { Helmet } from 'react-helmet';
import { AcknowledgementDashboard } from '../components/AcknowledgementDashboard';
import { ReminderManager } from '../components/ReminderManager';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/Tabs';
import styles from './acknowledgements.module.css';

/**
 * The Acknowledgements page provides a comprehensive dashboard for administrators
 * to monitor and manage policy acknowledgements across the organization.
 */
const AcknowledgementsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Acknowledgements Dashboard - MyPolicyPortal</title>
        <meta
          name="description"
          content="Track and manage policy acknowledgements. View overall statistics, filter policies, and monitor compliance across the organization."
        />
      </Helmet>
      <div className={styles.pageContainer}>
        <DashboardPageHeader
          title="Acknowledgements"
          subtitle="Monitor and manage policy acknowledgement status across the organization."
        />
        <main className={styles.mainContent}>
          <Tabs defaultValue="dashboard" className={styles.tabsContainer}>
            <TabsList className={styles.tabsList}>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="reminders">Send Reminders</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className={styles.tabContent}>
              <AcknowledgementDashboard />
            </TabsContent>
            <TabsContent value="reminders" className={styles.tabContent}>
              <ReminderManager />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default AcknowledgementsPage;