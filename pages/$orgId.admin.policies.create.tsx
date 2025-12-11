import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PolicyCreateForm } from '../components/PolicyCreateForm';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/Breadcrumb';
import { useOrgNavigation } from '../helpers/useOrgNavigation';
import styles from './$orgId.admin.policies.create.module.css';

const CreatePolicyPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { buildUrl } = useOrgNavigation();
  const fromTemplate = searchParams.get('fromSuggestion') === 'true';

  const handleSuccess = (policyId: number) => {
    toast.success('Policy created successfully!');
    navigate(buildUrl(`/admin/policies/${policyId}`));
  };

  const handleBulkSuccess = (policies: Array<{id: number; title: string}>) => {
    toast.success(`${policies.length} ${policies.length === 1 ? 'policy' : 'policies'} created successfully!`);
    navigate(buildUrl('/admin/policies'));
  };

  return (
    <>
      <Helmet>
        <title>Create New Policy - MyPolicyPortal</title>
        <meta name="description" content="Create a new policy with AI assistance or manual entry." />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.breadcrumbWrapper}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={buildUrl('/admin/policies')}>Policies</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {fromTemplate && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={buildUrl('/admin/policy-templates')}>Policy Templates</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Create New Policy</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <main className={styles.main}>
          <PolicyCreateForm onSuccess={handleSuccess} onBulkSuccess={handleBulkSuccess} />
        </main>
      </div>
    </>
  );
};

export default CreatePolicyPage;