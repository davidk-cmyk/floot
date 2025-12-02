import React from "react";
import { Helmet } from "react-helmet";
import { PolicyAuditLog } from "../components/PolicyAuditLog";
import { DashboardPageHeader } from "../components/DashboardPageHeader";
import styles from "./audit.module.css";

const AuditPage = () => {
  return (
    <>
      <Helmet>
        <title>Audit Log - MyPolicyPortal</title>
        <meta
          name="description"
          content="View the complete audit trail for all policy management activities."
        />
      </Helmet>
      <div className={styles.pageContainer}>
        <DashboardPageHeader
          title="Audit Log"
          subtitle="Review a detailed, chronological record of all activities and changes related to policies within the system."
        />
        <main>
          <PolicyAuditLog />
        </main>
      </div>
    </>
  );
};

export default AuditPage;