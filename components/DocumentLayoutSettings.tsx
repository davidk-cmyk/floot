import React, { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useForm, Form, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from './Form';
import { useDocumentLayout, useUpdateDocumentLayout } from '../helpers/useDocumentLayoutApi';
import { usePortals } from '../helpers/usePortalApi';
import { documentLayoutSchema, dateFormatOptions, pageNumberingFormatOptions, defaultDocumentLayoutSettings } from '../endpoints/document-layout_GET.schema';
import { usePolicies, usePolicyDetails } from '../helpers/usePolicyApi';
import { VariableToggleSection } from './VariableToggleSection';
import { Button } from './Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Switch } from './Switch';
import { Skeleton } from './Skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
import { DocumentView } from './DocumentView';
import { AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import styles from './DocumentLayoutSettings.module.css';

const formSchema = documentLayoutSchema;
type DocumentLayoutFormData = z.infer<typeof formSchema>;

// Parse template to extract enabled variables
const parseTemplateVariables = (template: string | undefined): Set<string> => {
  if (!template) {
    return new Set<string>();
  }
  const matches = template.matchAll(/\/([^\/]+)\//g);
  const enabled = new Set<string>();
  for (const match of matches) {
    enabled.add(match[1]);
  }
  return enabled;
};

const PortalSelector = ({
  selectedPortalId,
  setSelectedPortalId,
}: {
  selectedPortalId: number | null;
  setSelectedPortalId: (id: number | null) => void;
}) => {
  const { data: portalsData, isFetching } = usePortals({ page: 1, limit: 100 });
  const portals = portalsData?.portals || [];

  return (
    <div className={styles.portalSelector}>
      <label htmlFor="portal-select" className={styles.portalLabel}>
        Configuration Scope
      </label>
      <Select
        value={selectedPortalId === null ? '__default' : String(selectedPortalId)}
        onValueChange={(value) => {
          if (value === '__default') {
            setSelectedPortalId(null);
          } else {
            setSelectedPortalId(Number(value));
          }
        }}
        disabled={isFetching}
      >
        <SelectTrigger id="portal-select" disabled={isFetching}>
          <SelectValue placeholder="Select a scope..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__default">Organization Default</SelectItem>
          {portals.map((portal) => (
            <SelectItem key={portal.id} value={String(portal.id)}>
              {portal.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className={styles.portalDescription}>
        Select a portal to create or edit specific layout settings, or choose "Organization Default" for the base configuration.
      </p>
    </div>
  );
};

export const DocumentLayoutSettings = () => {
  const [selectedPortalId, setSelectedPortalId] = useState<number | null>(null);
  const { data: layoutSettings, isFetching: isLoadingLayout } = useDocumentLayout(selectedPortalId ?? undefined);
  const { mutate: updateLayout, isPending: isUpdating } = useUpdateDocumentLayout();

  const { data: policiesData, isFetching: isLoadingPoliciesList } = usePolicies({ page: 1, limit: 1 });
  const samplePolicyId = useMemo(() => policiesData?.policies[0]?.id, [policiesData]);

  const { data: policyDetails, isFetching: isLoadingPolicyDetails } = usePolicyDetails(
    samplePolicyId!,
    { enabled: !!samplePolicyId }
  );

  const previewPolicy = useMemo(() => policyDetails?.policy, [policyDetails]);
  const isLoadingPolicies = isLoadingPoliciesList || isLoadingPolicyDetails;

  const form = useForm({
    schema: formSchema,
    defaultValues: defaultDocumentLayoutSettings,
  });

  // Parse enabled variables from current form values for immediate UI feedback
  const enabledHeaderVariables = useMemo(() => {
    return parseTemplateVariables(form.values.headerTemplate);
  }, [form.values.headerTemplate]);

  const enabledFooterVariables = useMemo(() => {
    return parseTemplateVariables(form.values.footerTemplate);
  }, [form.values.footerTemplate]);

  // Load initial settings when they change (e.g., switching portals)
  useEffect(() => {
    if (layoutSettings) {
      form.setValues(layoutSettings);
    } else {
      form.setValues(defaultDocumentLayoutSettings);
    }
  }, [layoutSettings, selectedPortalId]);

  // Handle template changes from variable toggles (updates preview immediately)
  const handleTemplateChange = (field: 'headerTemplate' | 'footerTemplate', value: string) => {
    console.log('[DocumentLayoutSettings.handleTemplateChange] Called with:', { field, value });
    form.setValues((prev) => ({ ...prev, [field]: value }));
  };

  // Debug: Log form.values whenever it changes
  useEffect(() => {
    console.log('[DocumentLayoutSettings] form.values changed:', form.values);
  }, [form.values]);

  const onSubmit = (data: DocumentLayoutFormData) => {
    updateLayout({
      ...data,
      portalId: selectedPortalId ?? undefined,
    }, {
      onSuccess: () => {
        toast.success('Document layout settings saved successfully!');
      },
      onError: () => {
        toast.error('Failed to save document layout settings. Please try again.');
      },
    });
  };

  const renderForm = () => (
    <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.formGrid}>
        <FormItem name="showMetadata" className={styles.switchItem}>
          <div className={styles.switchLabelContainer}>
            <FormLabel>Show Policy Metadata</FormLabel>
            <FormDescription>
              Display details like effective date, department, and tags at the start of the document.
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={form.values.showMetadata}
              onCheckedChange={(checked) => form.setValues((prev) => ({ ...prev, showMetadata: checked }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <div className={styles.spanFull}>
          <VariableToggleSection
            sectionName="Header Variables"
            enabledVariables={enabledHeaderVariables}
            onTemplateChange={(value) => handleTemplateChange('headerTemplate', value)}
          />
        </div>

        <div className={styles.spanFull}>
          <VariableToggleSection
            sectionName="Footer Variables"
            enabledVariables={enabledFooterVariables}
            onTemplateChange={(value) => handleTemplateChange('footerTemplate', value)}
          />
        </div>

        <FormItem name="dateFormat">
          <FormLabel>Date Format</FormLabel>
          <FormControl>
            <Select
              value={form.values.dateFormat}
              onValueChange={(value) => form.setValues((prev) => ({ ...prev, dateFormat: value as typeof dateFormatOptions[number] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                {dateFormatOptions.map((format) => (
                  <SelectItem key={format} value={format}>{format}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormDescription>
            How dates will be formatted in the document (affects /policy.effectiveDate/ and /document.printDate/).
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem name="pageNumberingFormat">
          <FormLabel>Page Numbering Format</FormLabel>
          <FormControl>
            <Select
              value={form.values.pageNumberingFormat}
              onValueChange={(value) => form.setValues((prev) => ({ ...prev, pageNumberingFormat: value as typeof pageNumberingFormatOptions[number] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select page numbering" />
              </SelectTrigger>
              <SelectContent>
                {pageNumberingFormatOptions.map((format) => (
                  <SelectItem key={format} value={format}>{format}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormDescription>
            How page numbers will be displayed (affects /document.pageNumber/ and /document.totalPages/).
          </FormDescription>
          <FormMessage />
        </FormItem>

      </div>

      <div className={styles.formActions}>
        <Button type="submit" disabled={isUpdating || !form.isValid}>
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );

  const renderPreview = () => {
    if (isLoadingPolicies) {
      return <Skeleton style={{ height: '500px', width: '100%' }} />;
    }
    if (!previewPolicy) {
      return (
        <div className={styles.infoBox}>
          <AlertCircle size={16} />
          <p>No policies found to generate a preview. Please create a policy first.</p>
        </div>
      );
    }
    return (
      <div className={styles.previewWrapper}>
        <div className={styles.infoBox}>
          <Info size={16} />
          <p>
            This preview shows how your document will look when printed or exported to PDF. 
            The preview uses the current, unsaved values from the editor. Click "Save Changes" to persist your settings.
          </p>
        </div>
        <DocumentView
          key={JSON.stringify(form.values)}
          policy={previewPolicy}
          layoutSettings={form.values}
        />
      </div>
    );
  };

  if (isLoadingLayout) {
    return (
      <div className={styles.container}>
        <Skeleton style={{ height: '2rem', width: '250px', marginBottom: '0.5rem' }} />
        <Skeleton style={{ height: '1rem', width: '400px', marginBottom: '1.5rem' }} />
        <Skeleton style={{ height: '400px' }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Document Layout</h2>
        <p className={styles.description}>
          Select which variables to include in the document header and footer. Templates are automatically generated based on your selections.
        </p>
      </div>
      <div className={styles.card}>
        <PortalSelector selectedPortalId={selectedPortalId} setSelectedPortalId={setSelectedPortalId} />
      </div>
      <Form {...form}>
        <Tabs defaultValue="editor" className={styles.tabsContainer}>
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Live Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="editor" className={styles.card}>
            {renderForm()}
          </TabsContent>
          <TabsContent value="preview" className={styles.card}>
            {renderPreview()}
          </TabsContent>
        </Tabs>
      </Form>
    </div>
  );
};