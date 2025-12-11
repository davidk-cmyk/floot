import React from 'react';
import { Helmet } from 'react-helmet';
import { PortalManager } from '../components/PortalManager';
import styles from './$orgId.admin.settings.portals.module.css';

const OrgAdminSettingsPortalsPage = () => {

  return (
    <>
      <Helmet>
        <title>Portal Management - MyPolicyPortal</title>
        <meta
          name="description"
          content="Manage and configure all policy portals for your organization."
        />
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Portal Management</h1>
          <p className={styles.subtitle}>
            Create, configure, and manage all policy portals for your organization.
          </p>
        </header>
        <main className={styles.content}>
          <PortalManager />
        </main>
      </div>
    </>
  );
};

export default OrgAdminSettingsPortalsPage;