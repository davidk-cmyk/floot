import React from 'react';
import { Helmet } from 'react-helmet';
import { PolicyTemplateLibrary } from '../components/PolicyTemplateLibrary';
import { PolicySuggestions } from '../components/PolicySuggestions';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import styles from './$orgId.admin.policy-templates.module.css';

const OrgAdminPolicyTemplatesPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Policy Templates - MyPolicyPortal</title>
        <meta
          name="description"
          content="Browse and use pre-written policy templates for your UK small business."
        />
      </Helmet>
      <div className={styles.container}>
        <DashboardPageHeader
          title="Policy Template Library"
          subtitle="Get started quickly with our library of UK-specific policy templates for small businesses. Select a template to customize it for your organization."
        />
        <main className={styles.main}>
          <PolicyTemplateLibrary />
          <PolicySuggestions />
        </main>
      </div>
    </>
  );
};

export default OrgAdminPolicyTemplatesPage;