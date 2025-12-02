import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PortalManager } from '../components/PortalManager';
import { useOrgNavigation } from '../helpers/useOrgNavigation';
import styles from './$orgId.admin.settings.portals.module.css';

const OrgAdminSettingsPortalsPage = () => {
  const { buildUrl } = useOrgNavigation();

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
          <nav className={styles.breadcrumbs}>
            <Link to={buildUrl('/admin/settings')} className={styles.breadcrumbLink}>
              Settings
            </Link>
            <ChevronRight size={16} className={styles.breadcrumbSeparator} />
            <span className={styles.breadcrumbCurrent}>Portals</span>
          </nav>
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