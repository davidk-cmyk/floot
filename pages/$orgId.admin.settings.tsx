import React from "react";
import { Helmet } from "react-helmet";
import { useLocation, Link } from "react-router-dom";
import { BrandingSettings } from "../components/BrandingSettings";
import { DocumentLayoutSettings } from "../components/DocumentLayoutSettings";
import { SettingsListManager } from "../components/SettingsListManager";
import { HybridTaxonomyManager } from "../components/HybridTaxonomyManager";
import { SettingsBooleanManager } from "../components/SettingsBooleanManager";
import { VariableManager } from "../components/VariableManager";
import { PolicyDownloadSettings } from "../components/PolicyDownloadSettings";
import { OrganizationDeletionSection } from "../components/OrganizationDeletionSection";

import { useOrganization } from "../helpers/useOrganization";
import { useAuth } from "../helpers/useAuth";
import { useUpdateOrganization } from "../helpers/useOrganizationApi";
import { Form, FormItem, FormLabel, FormControl, FormMessage, useForm } from "../components/Form";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import { Building, Info, Edit2, X, Check } from 'lucide-react';
import { z } from 'zod';

import { SettingsNavigation } from "../components/SettingsNavigation";
import { PortalManager } from "../components/PortalManager";
import { useOrgNavigation } from "../helpers/useOrgNavigation";
import styles from "./settings.module.css";

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
  const [isEditing, setIsEditing] = React.useState(false);

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
  React.useEffect(() => {
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
  React.useEffect(() => {
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
      <div className={styles.organizationCard}>
        <div className={styles.organizationCardHeader}>
          <Skeleton style={{ height: '1.75rem', width: '200px' }} />
        </div>
        <div className={styles.organizationCardContent}>
          <Skeleton style={{ height: '1rem', width: '80%' }} />
          <Skeleton style={{ height: '1rem', width: '60%' }} />
        </div>
      </div>
    );
  }

  if (organizationState.type === 'no-organization') {
    return (
      <div className={`${styles.organizationCard} ${styles.organizationNoticeCard}`}>
        <Info size={20} className={styles.organizationNoticeIcon} />
        <p>No active organization selected. Please create or select an organization.</p>
      </div>
    );
  }

  if (organizationState.type === 'switching') {
    return (
      <div className={styles.organizationCard}>
        <div className={styles.organizationCardHeader}>
          <Building size={24} />
          <h3 className={styles.organizationCardTitle}>Current Organization</h3>
        </div>
        <div className={styles.organizationCardContent}>
          <div className={styles.organizationNoticeCard}>
            <Info size={20} className={styles.organizationNoticeIcon} />
            <p>Switching organizations...</p>
          </div>
        </div>
      </div>
    );
  }

  // At this point, organizationState.type === 'active' and currentOrganization is guaranteed to exist
  const { currentOrganization } = organizationState;

  return (
    <div className={styles.organizationCard}>
      <div className={styles.organizationCardHeader}>
        <Building size={24} />
        <h3 className={styles.organizationCardTitle}>Current Organization</h3>
        {isAdmin && !isEditing && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsEditing(true)}
            className={styles.organizationEditButton}
          >
            <Edit2 size={16} />
          </Button>
        )}
      </div>
      <div className={styles.organizationCardContent}>
        {isEditing && isAdmin ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className={styles.organizationEditForm}>
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
                <FormLabel>
                  Custom Domain
                  <span style={{ marginLeft: '8px', fontSize: '0.75rem', padding: '2px 6px', backgroundColor: 'var(--muted)', borderRadius: '4px', color: 'var(--muted-foreground)' }}>Coming Soon</span>
                </FormLabel>
                <FormControl>
                  <Input
                    value=""
                    placeholder="example.com"
                    disabled={true}
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  />
                </FormControl>
              </FormItem>

              <div className={styles.organizationFormActions}>
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
            <div className={styles.organizationDetailItem}>
              <span className={styles.organizationDetailLabel}>Name</span>
              <span className={styles.organizationDetailValue}>{currentOrganization.name}</span>
            </div>
            <div className={styles.organizationDetailItem}>
              <span className={styles.organizationDetailLabel}>
                Custom Domain
                <span style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 6px', backgroundColor: 'var(--muted)', borderRadius: '4px', color: 'var(--muted-foreground)' }}>Coming Soon</span>
              </span>
              <span className={styles.organizationDetailValue} style={{ opacity: 0.5 }}>Not available yet</span>
            </div>
            <div className={styles.organizationDetailItem}>
              <span className={styles.organizationDetailLabel}>Slug</span>
              <span className={styles.organizationDetailValue}>{currentOrganization.slug}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const location = useLocation();
  const activeHash = location.hash || '#branding';
  const { authState } = useAuth();
  const { organizationState } = useOrganization();
  const { buildUrl } = useOrgNavigation();
  const isAdmin = authState.type === 'authenticated' && authState.user.role === 'admin';

  const renderActiveSection = () => {
    switch (activeHash) {
      case '#branding':
        return (
          <section id="branding" className={styles.section}>
            <h2 className={styles.sectionTitle}>Branding & Appearance</h2>
            <div className={styles.grid}>
              <BrandingSettings />
            </div>
          </section>
        );
      
      case '#policy-management':
        return (
          <section id="policy-management" className={styles.section}>
            <h2 className={styles.sectionTitle}>Policy Management</h2>
            <div className={styles.grid}>
              <HybridTaxonomyManager
                title="Policy Categories"
                description="Manage the categories available for organizing policies. Standard categories are provided for consistent analytics."
                taxonomyType="categories"
              />
              <HybridTaxonomyManager
                title="Policy Departments"
                description="Manage the departments that policies can be assigned to. Standard departments are provided for consistent analytics."
                taxonomyType="departments"
              />
              <HybridTaxonomyManager
                title="Policy Tags"
                description="Manage tags to improve policy searchability and filtering. Standard tags are provided for consistent analytics."
                taxonomyType="tags"
              />
            </div>
          </section>
        );
      
      case '#user-access':
        return (
          <section id="user-access" className={styles.section}>
            <h2 className={styles.sectionTitle}>User Access</h2>
            <div className={styles.comingSoonContainer}>
              <Info size={32} className={styles.comingSoonIcon} />
              <h3 className={styles.comingSoonTitle}>Coming Soon</h3>
              <p className={styles.comingSoonDescription}>
                User access settings are under development and will be available soon.
              </p>
            </div>
          </section>
        );

      case '#acknowledgment-settings':
        return (
          <section id="acknowledgment-settings" className={styles.section}>
            <h2 className={styles.sectionTitle}>Policy Acknowledgment</h2>
            <div className={styles.comingSoonContainer}>
              <Info size={32} className={styles.comingSoonIcon} />
              <h3 className={styles.comingSoonTitle}>Coming Soon</h3>
              <p className={styles.comingSoonDescription}>
                Policy acknowledgment settings are under development and will be available soon.
              </p>
            </div>
          </section>
        );
      
      case '#portals':
        return (
          <section id="portals" className={styles.section}>
            <h2 className={styles.sectionTitle}>Portal Management</h2>
            <div className={styles.portalSection}>
              <PortalManager />
            </div>
          </section>
        );

      case '#policy-documents':
        return (
          <section id="policy-documents" className={styles.section}>
            <h2 className={styles.sectionTitle}>Layout Settings</h2>
            <div className={styles.organizationsSingleColumn}>
              <DocumentLayoutSettings />
            </div>
          </section>
        );

      case '#download-settings':
        return (
          <section id="download-settings" className={styles.section}>
            <h2 className={styles.sectionTitle}>Download Settings</h2>
            {isAdmin ? (
              <div className={styles.organizationsSingleColumn}>
                <PolicyDownloadSettings />
              </div>
            ) : (
              <div className={styles.accessDenied}>
                <p>Access denied. Administrator privileges required to manage download settings.</p>
              </div>
            )}
          </section>
        );

      case '#organizations':
        return (
          <section id="organizations" className={styles.section}>
                        <h2 className={styles.sectionTitle}>Organisation</h2>
            <div className={styles.organizationsSingleColumn}>
              <OrganizationDetails />
              {isAdmin && organizationState.type === 'active' && organizationState.currentOrganization && (
                <div className={styles.dangerZone}>
                  <div className={styles.dangerZoneHeader}>
                    <h3 className={styles.dangerZoneTitle}>Danger Zone</h3>
                    <p className={styles.dangerZoneDescription}>
                      Irreversible and destructive actions for this organization.
                    </p>
                  </div>
                  <OrganizationDeletionSection 
                    organization={organizationState.currentOrganization}
                  />
                </div>
              )}
            </div>
          </section>
        );

      case '#organization-variables':
        return (
          <section id="organization-variables" className={styles.section}>
                        <h2 className={styles.sectionTitle}>Organisation Variables</h2>
            <div className={styles.grid}>
              <VariableManager />
            </div>
          </section>
        );

      case '#audit-trail':
        return (
          <section id="audit-trail" className={styles.section}>
            <h2 className={styles.sectionTitle}>Audit Trail</h2>
            <div className={styles.auditRedirect}>
              <p>The audit trail has been moved to a dedicated page for better performance and functionality.</p>
              <Link to={buildUrl('/admin/audit')} className={styles.auditLink}>
                View Audit Trail →
              </Link>
            </div>
          </section>
        );
      
      default:
        return (
          <section id="branding" className={styles.section}>
            <h2 className={styles.sectionTitle}>Branding & Appearance</h2>
            <div className={styles.grid}>
              <BrandingSettings />
            </div>
          </section>
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>System Settings - MyPolicyPortal</title>
        <meta
          name="description"
          content="Manage system-wide settings for MyPolicyPortal, including branding, policy management, user access, and the public portal."
        />
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>System Settings</h1>
          <p className={styles.subtitle}>
            Configure system-wide settings for policies and user management.
          </p>
        </header>

        <div className={styles.layout}>
          <SettingsNavigation className={styles.sidebar} />
          <main className={styles.content}>
            {renderActiveSection()}
          </main>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;