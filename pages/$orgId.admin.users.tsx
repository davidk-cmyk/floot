import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { UserManagementTable } from "../components/UserManagementTable";
import { Button } from "../components/Button";
import { DashboardPageHeader } from "../components/DashboardPageHeader";
import { useOrgNavigation } from "../helpers/useOrgNavigation";
import styles from "./users.module.css";

const UsersPage: React.FC = () => {
  const { buildUrl } = useOrgNavigation();

  return (
    <>
      <Helmet>
        <title>User Management - MyPolicyPortal</title>
        <meta name="description" content="Manage users and their roles." />
      </Helmet>
      <div className={styles.pageContainer}>
        <DashboardPageHeader
          title="User Management"
          subtitle="View, manage, and assign roles to users in your organization."
          actions={
            <Button asChild>
              <Link to={buildUrl('/admin/users/create')}>
                <Plus size={16} />
                Add New User
              </Link>
            </Button>
          }
        />
        <main className={styles.mainContent}>
          <UserManagementTable />
        </main>
      </div>
    </>
  );
};

export default UsersPage;