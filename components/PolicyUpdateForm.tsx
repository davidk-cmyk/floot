import React, { useRef, useCallback, useState, useEffect } from 'react';
import { PolicyWithAuthor } from '../endpoints/policies/get_POST.schema';
import { usePolicyForm } from '../helpers/usePolicyForm';
import { usePolicyFormActions } from '../helpers/usePolicyFormActions';
import { PolicyFormShell } from './PolicyFormShell';
import { PolicyFormActions } from './PolicyFormActions';
import { UniversalPolicyEditor } from './UniversalPolicyEditor';
import { Form } from './Form';
import { useAutosave } from '../helpers/useAutosave';
import { UniversalPolicyFormValues } from '../helpers/universalPolicyFormSchema';
import { PortalAssignmentModal } from './PortalAssignmentModal';
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
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [justAssignedPortals, setJustAssignedPortals] = useState(false);

  // Reset justAssignedPortals when policy changes or portals are removed
  useEffect(() => {
    const hasPortals = policy.assignedPortals && policy.assignedPortals.length > 0;
    if (!hasPortals) {
      setJustAssignedPortals(false);
    }
  }, [policy.id, policy.assignedPortals]);
  
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

  const doPublish = useCallback(() => {
    handleSubmit(form.values, 'publish');
  }, [form.values, handleSubmit]);

  const handlePublishNow = useCallback(() => {
    const hasExistingPortals = policy.assignedPortals && policy.assignedPortals.length > 0;
    const hasFormPortals = form.values.portalIds && form.values.portalIds.length > 0;
    const hasPortals = hasExistingPortals || hasFormPortals || justAssignedPortals;
    
    if (!hasPortals) {
      setShowPortalModal(true);
    } else {
      doPublish();
    }
  }, [policy.assignedPortals, form.values.portalIds, justAssignedPortals, doPublish]);

  const handleAssignmentComplete = useCallback(() => {
    setJustAssignedPortals(true);
    setShowPortalModal(false);
    doPublish();
  }, [doPublish]);

  // Manual save handler for the shell - routes through portal check
  const submitToDatabase = useCallback(() => {
    // Trigger form validation, then check portals before publishing
    form.handleSubmit(() => {
      handlePublishNow();
    })({ preventDefault: () => {} } as React.FormEvent);
  }, [form, handlePublishNow]);

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
    <>
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(() => {
            handlePublishNow(); // Route through portal check before publishing
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

      <PortalAssignmentModal
        isOpen={showPortalModal}
        onClose={() => setShowPortalModal(false)}
        policyId={policy.id}
        policyTitle={policy.title}
        onAssignmentComplete={handleAssignmentComplete}
      />
    </>
  );
};