import React, { useRef } from 'react';
import { Wand2, Edit, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { Form } from './Form';
import { useAuth } from '../helpers/useAuth';
import { useUrlFormLoader } from '../helpers/useUrlFormLoader';
import { usePolicyFormTabs } from '../helpers/usePolicyFormTabs';
import { usePolicyForm } from '../helpers/usePolicyForm';
import { usePolicyFormActions } from '../helpers/usePolicyFormActions';
import { PolicyFormShell } from './PolicyFormShell';
import { PolicyFormActions } from './PolicyFormActions';
import { UniversalPolicyEditor } from './UniversalPolicyEditor';
import { AIPolicyTab } from './AIPolicyTab';
import { FileUploadPolicyTab } from './FileUploadPolicyTab';
import { useAutosave } from '../helpers/useAutosave';
import styles from './PolicyCreateForm.module.css';

interface PolicyCreateFormProps {
  onSuccess?: (policyId: number) => void;
  className?: string;
}

export const PolicyCreateForm: React.FC<PolicyCreateFormProps> = ({ onSuccess, className }) => {
  const { authState } = useAuth();
  const titleInputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
  
  // Initialize form with universal schema and hooks
  const { form, clearAutosavedData } = usePolicyForm({
    mode: 'create',
  });

  // Submission handling
  const { handleSubmit, isSubmitting, submitType } = usePolicyFormActions({
    mode: 'create',
    onSuccess,
    clearAutosavedData,
  });

  // Tab management - adapted to work with universal form values
  const { activeTab, setActiveTab, handlePolicyGenerated, handleFileContentExtracted } = usePolicyFormTabs({
    setFormValues: form.setValues,
  });

  // URL parameter processing
  const { hasProcessed } = useUrlFormLoader({
    setFormValues: form.setValues,
    setActiveTab,
  });

  // Get autosave status for the shell
  const autosaveHook = useAutosave({
    values: form.values,
    storageKey: 'policy-draft-autosave-new',
    onRestore: (data) => form.setValues(() => data),
    enabled: hasProcessed,
  });

  // Wrapper function to handle tab value change type conversion
  const handleTabChange = React.useCallback((value: string) => {
    setActiveTab(value as 'ai' | 'upload' | 'manual');
  }, [setActiveTab]);

  // Action handlers for the form shell
  const handleSaveDraft = React.useCallback(() => {
    handleSubmit(form.values, 'draft');
  }, [form.values, handleSubmit]);

  const handleSubmitForApproval = React.useCallback(() => {
    handleSubmit(form.values, 'approval');
  }, [form.values, handleSubmit]);

  const handlePublishNow = React.useCallback(() => {
    handleSubmit(form.values, 'publish');
  }, [form.values, handleSubmit]);

  // Manual save handler for the shell
  const handleManualSave = () => {
    autosaveHook.saveNow?.();
  };

  // Loading and auth states
  if (authState.type === 'loading') {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSkeleton} />
        </div>
      </div>
    );
  }

  if (authState.type === 'unauthenticated') {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.authRequired}>
          <h2>Authentication Required</h2>
          <p>You must be logged in to create policies.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className={styles.tabs}>
                <div className={styles.header}>
          <TabsList role="tablist" aria-label="Policy creation methods">
            <TabsTrigger value="ai" aria-label="AI Generator tab">
              <Wand2 size={16} />
              AI Generator
            </TabsTrigger>
            <TabsTrigger value="upload" aria-label="Document Upload tab">
              <Upload size={16} />
              Upload Document
            </TabsTrigger>
            <TabsTrigger value="manual" aria-label="Manual Editor tab">
              <Edit size={16} />
              Manual Editor
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="ai" className={styles.tabContent} role="tabpanel">
          <AIPolicyTab
            onPolicyGenerated={handlePolicyGenerated}
            initialValues={{
              topic: '',
              category: '',
              department: '',
              keyRequirements: '',
              tags: [],
            }}
          />
        </TabsContent>

        <TabsContent value="upload" className={styles.tabContent} role="tabpanel">
          <FileUploadPolicyTab onContentExtracted={handleFileContentExtracted} />
        </TabsContent>

        <TabsContent value="manual" className={styles.tabContent} role="tabpanel">
          <PolicyFormShell
            mode="create"
            autosaveStatus={autosaveHook.status}
            lastSaved={autosaveHook.lastSaved ?? undefined}
            hasUnsavedChanges={autosaveHook.hasUnsavedChanges}
            onManualSave={handleManualSave}
            isSaving={autosaveHook.status === 'saving'}
            headerContent={
              <PolicyFormActions
                className={styles.headerActions}
                onSaveDraft={handleSaveDraft}
                onSubmitForApproval={handleSubmitForApproval}
                onPublishNow={handlePublishNow}
                isSubmitting={isSubmitting}
                submitType={submitType}
              />
            }
          >
            <Form {...form}>
              <UniversalPolicyEditor
                form={form}
                mode="create"
                titleInputRef={titleInputRef}
              />
            </Form>
          </PolicyFormShell>
        </TabsContent>
      </Tabs>
    </div>
  );
};