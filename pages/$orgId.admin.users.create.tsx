import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { UserCreateForm } from '../components/UserCreateForm';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/Breadcrumb';
import { useOrgNavigation } from '../helpers/useOrgNavigation';
import styles from './users.create.module.css';

const CreateUserPage: React.FC = () => {
  const { buildUrl } = useOrgNavigation();

  return (
    <>
      <Helmet>
        <title>Add New User - MyPolicyPortal</title>
        <meta name="description" content="Create a new user account." />
      </Helmet>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={buildUrl('/admin/users')}>Users</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Add New User</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className={styles.mainContent}>
          <div className={styles.titleContainer}>
            <h1 className={styles.pageTitle}>Add New User</h1>
            <p className={styles.pageDescription}>
              Fill out the form below to create a new user account and assign them a role.
            </p>
          </div>
          <div className={styles.formContainer}>
            <UserCreateForm />
          </div>
        </main>
      </div>
    </>
  );
};

export default CreateUserPage;