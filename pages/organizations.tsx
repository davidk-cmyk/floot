import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { SettingsNavigation } from '../components/SettingsNavigation';
import { useOrganization } from '../helpers/useOrganization';
import { useAuth } from '../helpers/useAuth';
import { useUpdateOrganization } from '../helpers/useOrganizationApi';
import { CreateOrganizationForm } from '../components/CreateOrganizationForm';
import { Form, FormItem, FormLabel, FormControl, FormMessage, useForm } from '../components/Form';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { AlertCircle, Building, Info, Edit2, X, Check } from 'lucide-react';
import { z } from 'zod';
import styles from './organizations.module.css';

// Form schema for organization updates
const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required.'),
  slug: z
    .string()
    .min(3, 'URL slug must be at least 3 characters.')
    .regex(/^[a-z0-9-]+$/, 'URL slug can only contain lowercase letters, numbers, and hyphens.'),
  domain: z.string().nullable().optional(),
});

const generateSlugFromName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const OrganizationDetails = () => {
  const { organizationState, refetchOrganizations } = useOrganization();
  const { authState } = useAuth();
  const updateOrganization = useUpdateOrganization();
  const [isEditing, setIsEditing] = useState(false);

  const isAdmin = authState.type === 'authenticated' && authState.user.role === 'admin';

  const form = useForm({
    defaultValues: {
      name: '',
      slug: '',
      domain: '',
    },
    schema: updateOrganizationSchema,
  });

  // Update form values when organization data changes
  useEffect(() => {
    if (organizationState.type === 'active' && organizationState.currentOrganization) {
      const org = organizationState.currentOrganization;
      form.setValues({
        name: org.name,
        slug: org.slug,
        domain: org.domain || '',
      });
    }
  }, [organizationState, form.setValues]);

  // Auto-generate slug from name
  useEffect(() => {
    if (isEditing && form.values.name) {
      const generatedSlug = generateSlugFromName(form.values.name);
      // Only auto-update slug if user hasn't manually modified it
      if (!form.values.slug || form.values.slug === generateSlugFromName(form.defaultValues.name ?? '')) {
        form.setValues(prev => ({ ...prev, slug: generatedSlug }));
      }
    }
  }, [form.values.name, isEditing, form.setValues, form.values.slug, form.defaultValues.name]);

  const handleSave = async (data: z.infer<typeof updateOrganizationSchema>) => {
    if (organizationState.type !== 'active' || !organizationState.currentOrganization) {
      return;
    }

    try {
      await updateOrganization.mutateAsync({
        organizationId: organizationState.currentOrganization.id,
        name: data.name,
        slug: data.slug,
        domain: data.domain || null,
      });
      
      // Refetch organization data to get updated values
      await refetchOrganizations();
      setIsEditing(false);
      
      console.log('Organization updated successfully');
    } catch (error) {
      console.error('Failed to update organization:', error);
      form.setFieldError('name', error instanceof Error ? error.message : 'Failed to update organization');
    }
  };

  const handleCancel = () => {
    if (organizationState.type === 'active' && organizationState.currentOrganization) {
      const org = organizationState.currentOrganization;
      form.setValues({
        name: org.name,
        slug: org.slug,
        domain: org.domain || '',
      });
    }
    setIsEditing(false);
  };

  if (organizationState.type === 'loading') {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Skeleton style={{ height: '1.75rem', width: '200px' }} />
        </div>
        <div className={styles.cardContent}>
          <Skeleton style={{ height: '1rem', width: '80%' }} />
          <Skeleton style={{ height: '1rem', width: '60%' }} />
        </div>
      </div>
    );
  }

  if (organizationState.type === 'no-organization') {
    return (
      <div className={`${styles.card} ${styles.noticeCard}`}>
        <Info size={20} className={styles.noticeIcon} />
        <p>No active organization selected. Please create or select an organization.</p>
      </div>
    );
  }

  if (organizationState.type === 'switching') {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Building size={24} />
          <h2 className={styles.cardTitle}>Current Organization</h2>
        </div>
        <div className={styles.cardContent}>
          <div className={`${styles.noticeCard}`}>
            <Info size={20} className={styles.noticeIcon} />
            <p>Switching organizations...</p>
          </div>
        </div>
      </div>
    );
  }

  // At this point, organizationState.type === 'active' and currentOrganization is guaranteed to exist
  const { currentOrganization } = organizationState;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Building size={24} />
        <h2 className={styles.cardTitle}>Current Organization</h2>
        {isAdmin && !isEditing && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsEditing(true)}
            className={styles.editButton}
          >
            <Edit2 size={16} />
          </Button>
        )}
      </div>
      <div className={styles.cardContent}>
        {isEditing && isAdmin ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className={styles.editForm}>
              <FormItem name="name">
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input
                    value={form.values.name}
                    onChange={(e) => form.setValues(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter organization name"
                    disabled={updateOrganization.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="slug">
                <FormLabel>URL Slug</FormLabel>
                <FormControl>
                  <Input
                    value={form.values.slug}
                    onChange={(e) => form.setValues(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="organization-slug"
                    disabled={updateOrganization.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="domain">
                <FormLabel>Custom Domain (optional)</FormLabel>
                <FormControl>
                  <Input
                    value={form.values.domain || ''}
                    onChange={(e) => form.setValues(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="example.com"
                    disabled={updateOrganization.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <div className={styles.formActions}>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateOrganization.isPending}
                >
                  <Check size={16} />
                  {updateOrganization.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={updateOrganization.isPending}
                >
                  <X size={16} />
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Name</span>
              <span className={styles.detailValue}>{currentOrganization.name}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Domain</span>
              <span className={styles.detailValue}>{currentOrganization.domain || 'Not set'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Slug</span>
              <span className={styles.detailValue}>{currentOrganization.slug}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const OrganizationsPage = () => {
  const { authState } = useAuth();
  const isAdmin = authState.type === 'authenticated' && authState.user.role === 'admin';

  return (
    <>
      <Helmet>
        <title>Organizations - MyPolicyPortal</title>
        <meta name="description" content="Manage your organizations, switch between them, and invite new members." />
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Organizations</h1>
          <p className={styles.subtitle}>
            Manage your organization settings, members, and create new organizations.
          </p>
        </header>

        <div className={styles.layout}>
          <SettingsNavigation className={styles.sidebar} />
          <main className={styles.content}>
            <div className={styles.grid}>
              <div className={styles.column}>
                <OrganizationDetails />
              </div>
              <div className={styles.column}>
                {isAdmin && <CreateOrganizationForm />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default OrganizationsPage;