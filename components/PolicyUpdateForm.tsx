import React, { useRef, useCallback } from 'react';
import { PolicyWithAuthor } from '../endpoints/policies/get_POST.schema';
import { usePolicyForm } from '../helpers/usePolicyForm';
import { usePolicyFormActions } from '../helpers/usePolicyFormActions';
import { PolicyFormShell } from './PolicyFormShell';
import { PolicyFormActions } from './PolicyFormActions';
import { UniversalPolicyEditor } from './UniversalPolicyEditor';
import { Form } from './Form';
import { useAutosave } from '../helpers/useAutosave';
import { UniversalPolicyFormValues } from '../helpers/universalPolicyFormSchema';
import styles from './PolicyUpdateForm.module.css';

interface PolicyUpdateFormProps {
  policy: PolicyWithAuthor;
  onSuccess?: () => void;
  className?: string;
}

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

export const PolicyUpdateForm: React.FC<PolicyUpdateFormProps> = ({ 
  policy, 
  onSuccess, 
  className 
}) => {
const titleInputRef = useRef<HTMLInputElement>(null!);
  
  // Use the shared form hook for edit mode
  const { form, clearAutosavedData } = usePolicyForm({
    mode: 'edit',
    existingPolicy: policy,
    policyId: policy.id,
  });

  // Use the shared form actions hook
  const { handleSubmit, isSubmitting, submitType } = usePolicyFormActions({
    mode: 'edit',
    policyId: policy.id,
    onSuccess,
    clearAutosavedData,
  });

  // Set up autosave with the same key structure as the original
  const {
    status: autosaveStatus,
    lastSaved,
    saveNow: performManualSave,
    hasUnsavedChanges,
  } = useAutosave<UniversalPolicyFormValues>({
    values: form.values,
    storageKey: `policy-draft-autosave-${policy.id}`,
    onRestore: () => {
      // Don't restore in edit mode to avoid overwriting existing data
    },
    enabled: true,
  });

  // Create action handlers for PolicyFormActions
  const handleSaveDraft = useCallback(() => {
    handleSubmit(form.values, 'draft');
  }, [form.values, handleSubmit]);

  const handleSubmitForApproval = useCallback(() => {
    handleSubmit(form.values, 'approval');
  }, [form.values, handleSubmit]);

  const handlePublishNow = useCallback(() => {
    handleSubmit(form.values, 'publish');
  }, [form.values, handleSubmit]);

  // Manual save handler for the shell
  const submitToDatabase = useCallback(() => {
    // Trigger form validation and submission
    form.handleSubmit((values) => {
      handleSubmit(values, 'publish');
    })({ preventDefault: () => {} } as React.FormEvent);
  }, [form, handleSubmit]);

  const headerContent = (
    <PolicyFormActions
      className={styles.headerActions}
      onSaveDraft={handleSaveDraft}
      onSubmitForApproval={handleSubmitForApproval}
      onPublishNow={handlePublishNow}
      isSubmitting={isSubmitting}
      submitType={submitType}
    />
  );

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit((values) => {
          handleSubmit(values, 'publish'); // Use 'publish' as the default action for updates
        })} 
        className={className}
      >
        <PolicyFormShell
          mode="edit"
          headerContent={headerContent}
          autosaveStatus={autosaveStatus}
          lastSaved={lastSaved || undefined}
          hasUnsavedChanges={hasUnsavedChanges}
          onManualSave={submitToDatabase}
          isSaving={isSubmitting}
          versionNumber={policy.currentVersion}
          className={className}
        >
          <UniversalPolicyEditor
            form={form}
            mode="edit"
            policyId={policy.id}
            titleInputRef={titleInputRef}
            assignedPortals={policy.assignedPortals}
          />
        </PolicyFormShell>
      </form>
    </Form>
  );
};