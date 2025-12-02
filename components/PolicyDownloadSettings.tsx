import React, { useEffect, useCallback } from 'react';
import { z } from 'zod';
import {
  useDownloadSettings,
  useUpdateDownloadSettings,
} from '../helpers/usePolicyDownloadApi';
import { useOrganizationVariables } from '../helpers/useOrganizationVariables';
import {
  schema as updateDownloadSettingsSchema,
} from '../endpoints/policies/download/settings_POST.schema';
import { supportedFormats } from '../endpoints/policies/download_POST.schema';
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from './Form';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Textarea } from './Textarea';
import { Switch } from './Switch';
import { Input } from './Input';
import { Skeleton } from './Skeleton';
import { LayoutTemplateSelector } from './LayoutTemplateSelector';
import { VariableManager } from './VariableManager';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
import { AlertCircle, FileText, Settings, Variable } from 'lucide-react';
import styles from './PolicyDownloadSettings.module.css';

const SettingsSkeleton = () => (
  <div className={styles.container}>
    <div className={styles.skeletonTabs}>
      <Skeleton style={{ height: '2.5rem', width: '100%', marginBottom: 'var(--spacing-4)' }} />
      <div className={styles.skeletonGrid}>
        <div className={styles.formGroup}>
          <Skeleton style={{ height: '1.25rem', width: '10rem', marginBottom: 'var(--spacing-2)' }} />
          <div className={styles.checkboxGroup}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={styles.checkboxItem}>
                <Skeleton style={{ height: '1.25rem', width: '1.25rem' }} />
                <Skeleton style={{ height: '1.25rem', width: '6rem' }} />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.formGroup}>
          <Skeleton style={{ height: '1.25rem', width: '8rem', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ height: '8rem' }} />
        </div>
        <div className={styles.formGroup}>
          <Skeleton style={{ height: '1.25rem', width: '8rem', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ height: '8rem' }} />
        </div>
      </div>
    </div>
  </div>
);

export const PolicyDownloadSettings: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { data: settings, isFetching, error } = useDownloadSettings();
  const { data: variables } = useOrganizationVariables();
  const updateSettings = useUpdateDownloadSettings();

  const form = useForm({
    schema: updateDownloadSettingsSchema,
    defaultValues: {
      enabledFormats: ['pdf'] as const,
      headerTemplate: '',
      footerTemplate: '',
      brandingEnabled: false,
      includeToc: false,
      rateLimitPerMinute: 10,
      dateFormat: 'YYYY-MM-DD',
      pageNumberFormat: 'Page {page} of {pages}',
      showMetadata: true,
      layoutTemplateId: null,
    },
  });

  // Stabilize the setValues function to prevent infinite renders
  const setFormValues = useCallback((values: any) => {
    form.setValues(values);
  }, [form.setValues]);

  useEffect(() => {
    if (settings) {
      setFormValues({
        enabledFormats: settings.enabledFormats ? [...settings.enabledFormats] : ['pdf'] as const,
        headerTemplate: settings.headerTemplate || '',
        footerTemplate: settings.footerTemplate || '',
        brandingEnabled: settings.brandingEnabled || false,
        includeToc: settings.includeToc || false,
        rateLimitPerMinute: settings.rateLimitPerMinute || 10,
        dateFormat: settings.dateFormat || 'YYYY-MM-DD',
        pageNumberFormat: settings.pageNumberFormat || 'Page {page} of {pages}',
        showMetadata: settings.showMetadata !== false, // Default to true
        layoutTemplateId: settings.layoutTemplateId || null,
      });
    }
  }, [settings, setFormValues]);

  const onSubmit = (values: z.infer<typeof updateDownloadSettingsSchema>) => {
    updateSettings.mutate(values);
  };

  if (isFetching) {
    return <SettingsSkeleton />;
  }

  if (error) {
    return (
      <div className={`${styles.container} ${styles.errorContainer}`}>
        <AlertCircle className={styles.errorIcon} />
        <p>Could not load download settings.</p>
        <p className={styles.errorMessage}>{error.message}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <Form {...form}>
        <Tabs defaultValue="formats" className={styles.tabs}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="formats">
              <FileText size={16} />
              Formats & Content
            </TabsTrigger>
            <TabsTrigger value="layout">
              <Settings size={16} />
              Layout & Formatting
            </TabsTrigger>
            <TabsTrigger value="variables">
              <Variable size={16} />
              Variables
            </TabsTrigger>
          </TabsList>

          <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
            <TabsContent value="formats" className={styles.tabContent}>
              <div className={styles.formGrid}>
                <FormItem name="enabledFormats" className={styles.spanFull}>
                  <FormLabel>Enabled Download Formats</FormLabel>
                  <FormDescription>
                    Select which file formats users are allowed to download policies in.
                  </FormDescription>
                  <div className={styles.checkboxGroup}>
                    {supportedFormats.map((format) => (
                      <div key={format} className={styles.checkboxItem}>
                        <FormControl>
                          <Checkbox
                            id={`format-${format}`}
                            checked={form.values.enabledFormats?.includes(format)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const currentFormats = form.values.enabledFormats || [];
                              const newFormats = checked
                                ? [...currentFormats, format]
                                : currentFormats.filter((f) => f !== format);
                              // Ensure at least one format is always selected
                              if (newFormats.length > 0) {
                                form.setValues((prev) => ({ ...prev, enabledFormats: newFormats as [typeof format, ...typeof format[]] }));
                              }
                            }}
                          />
                        </FormControl>
                        <label htmlFor={`format-${format}`} className={styles.checkboxLabel}>
                          {format.toUpperCase()}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>

                <FormItem name="headerTemplate">
                  <FormLabel>Header Template</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Company Confidential - {{company.name}}"
                      value={form.values.headerTemplate || ''}
                      onChange={(e) => form.setValues((prev) => ({ ...prev, headerTemplate: e.target.value }))}
                      rows={5}
                    />
                  </FormControl>
                  <FormDescription>
                    Content to appear in the header of downloaded documents. Supports variables (e.g., <code>{`{{company.name}}`}</code>) and Markdown. Variable values will be populated when generating the download.
                  </FormDescription>
                  <FormMessage />
                </FormItem>

                <FormItem name="footerTemplate">
                  <FormLabel>Footer Template</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., {{document.pageNumber}} of {{document.totalPages}} | {{company.name}}"
                      value={form.values.footerTemplate || ''}
                      onChange={(e) => form.setValues((prev) => ({ ...prev, footerTemplate: e.target.value }))}
                      rows={5}
                    />
                  </FormControl>
                  <FormDescription>
                    Content for the footer. Use variables like <code>{`{{document.pageNumber}}`}</code> and <code>{`{{document.totalPages}}`}</code>. Variable values will be populated when generating the download.
                  </FormDescription>
                  <FormMessage />
                </FormItem>

                <FormItem name="rateLimitPerMinute">
                  <FormLabel>Rate Limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      value={form.values.rateLimitPerMinute || ''}
                      onChange={(e) => form.setValues((prev) => ({ ...prev, rateLimitPerMinute: parseInt(e.target.value, 10) || null }))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum number of downloads allowed per user, per minute.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              </div>
            </TabsContent>

            <TabsContent value="layout" className={styles.tabContent}>
              <div className={styles.formGrid}>
                <FormItem name="layoutTemplateId" className={styles.spanFull}>
                  <FormLabel>Layout Template</FormLabel>
                  <FormDescription>
                    Choose a template that defines the overall layout and styling for downloaded documents.
                  </FormDescription>
                  <FormControl>
                    <LayoutTemplateSelector
                      value={form.values.layoutTemplateId}
                      onChange={(id) => form.setValues((prev) => ({ ...prev, layoutTemplateId: id }))}
                      className={styles.templateSelector}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormItem name="dateFormat">
                  <FormLabel>Date Format</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., YYYY-MM-DD or DD/MM/YYYY"
                      value={form.values.dateFormat || ''}
                      onChange={(e) => form.setValues((prev) => ({ ...prev, dateFormat: e.target.value }))}
                    />
                  </FormControl>
                  <FormDescription>
                    Format for displaying dates in documents. Uses standard date format tokens.
                  </FormDescription>
                  <FormMessage />
                </FormItem>

                <FormItem name="pageNumberFormat">
                  <FormLabel>Page Number Format</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Page {page} of {pages}"
                      value={form.values.pageNumberFormat || ''}
                      onChange={(e) => form.setValues((prev) => ({ ...prev, pageNumberFormat: e.target.value }))}
                    />
                  </FormControl>
                  <FormDescription>
                    Template for page numbering. Use <code>{`{page}`}</code> and <code>{`{pages}`}</code> placeholders.
                  </FormDescription>
                  <FormMessage />
                </FormItem>

                <FormItem name="brandingEnabled" className={styles.switchItem}>
                  <div className={styles.switchContent}>
                    <FormLabel>Enable Branding</FormLabel>
                    <FormDescription>
                      Include your organization's logo and colors in downloads.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={form.values.brandingEnabled || false}
                      onCheckedChange={(checked) => form.setValues((prev) => ({ ...prev, brandingEnabled: checked }))}
                    />
                  </FormControl>
                </FormItem>

                <FormItem name="includeToc" className={styles.switchItem}>
                  <div className={styles.switchContent}>
                    <FormLabel>Include Table of Contents</FormLabel>
                    <FormDescription>
                      Automatically generate a table of contents for PDF documents.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={form.values.includeToc || false}
                      onCheckedChange={(checked) => form.setValues((prev) => ({ ...prev, includeToc: checked }))}
                    />
                  </FormControl>
                </FormItem>

                <FormItem name="showMetadata" className={styles.switchItem}>
                  <div className={styles.switchContent}>
                    <FormLabel>Show Metadata</FormLabel>
                    <FormDescription>
                      Include policy metadata (version, effective date, etc.) in downloads.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={form.values.showMetadata !== false}
                      onCheckedChange={(checked) => form.setValues((prev) => ({ ...prev, showMetadata: checked }))}
                    />
                  </FormControl>
                </FormItem>
              </div>
            </TabsContent>

            <TabsContent value="variables" className={styles.tabContent}>
              <div className={styles.variablesSection}>
                <VariableManager />
              </div>
            </TabsContent>

            <div className={styles.footer}>
              <Button type="submit" disabled={updateSettings.isPending}>
                {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Tabs>
      </Form>
    </div>
  );
};