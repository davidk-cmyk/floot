import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCreatePolicy, useUpdatePolicy } from './usePolicyApi';
import { UniversalPolicyFormValues } from './universalPolicyFormSchema';
import { InputType as CreatePolicyInput } from '../endpoints/policies/create_POST.schema';
import { InputType as UpdatePolicyInput } from '../endpoints/policies/update_POST.schema';

interface UsePolicyFormActionsProps {
  mode: 'create' | 'edit';
  policyId?: number;
  onSuccess?: (policyId: number) => void;
  clearAutosavedData: () => void;
}

/**
 * A hook that centralizes the submission logic for the universal policy form.
 * It handles API mutations for both create and edit modes, manages submission states,
 * and orchestrates post-submission actions like showing toasts and navigation.
 *
 * @param {UsePolicyFormActionsProps} props - Configuration including mode, policyId, and callbacks.
 * @returns An object with submission handlers and the current submission state.
 */
export function usePolicyFormActions({
  mode,
  policyId,
  onSuccess,
  clearAutosavedData,
}: UsePolicyFormActionsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createPolicyMutation = useCreatePolicy();
  const updatePolicyMutation = useUpdatePolicy();

  const [submitType, setSubmitType] = useState<'draft' | 'approval' | 'publish' | null>(null);

  const isSubmitting = createPolicyMutation.isPending || updatePolicyMutation.isPending;

  const handleSubmit = (values: UniversalPolicyFormValues, action: 'draft' | 'approval' | 'publish') => {
    setSubmitType(action);

    // Build commonData object conditionally to include date fields only when they're not undefined
    // This allows null values (explicitly cleared dates) to pass through
    // while removing undefined values (no change or uninitialized state)
    const commonData = {
      title: values.title,
      content: values.content,
      tags: values.tags,
      department: values.department,
      category: values.category,
      requiresAcknowledgment: values.requiresAcknowledgment,
      portalIds: values.portalIds || [],
      ...(values.effectiveDate !== undefined && { effectiveDate: values.effectiveDate }),
      ...(values.expirationDate !== undefined && { expirationDate: values.expirationDate }),
      ...(values.reviewDate !== undefined && { reviewDate: values.reviewDate }),
    };

    const handleSuccess = (data: { id: number }) => {
      clearAutosavedData();
      // Invalidate portal-related queries
      queryClient.invalidateQueries({ queryKey: ['portalAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['portals', 'list'] });
      if (onSuccess) {
        onSuccess(data.id);
      } else {
        // Default navigation behavior if no onSuccess callback is provided
        navigate(`/policies/${data.id}`);
      }
    };

    const handleSettled = () => {
      setSubmitType(null);
    };

    if (mode === 'create') {
      const apiValues: CreatePolicyInput = commonData;
      createPolicyMutation.mutate(apiValues, {
        onSuccess: handleSuccess,
        onSettled: handleSettled,
      });
    } else if (mode === 'edit' && policyId) {
      // Determine the correct status based on the action type
      // 'publish' action -> 'published' status
      // 'draft' action -> 'draft' status  
      // 'approval' action -> keep existing form status (for future approval workflow)
      const statusFromAction = action === 'publish' ? 'published' : action === 'draft' ? 'draft' : values.status;
      
      const apiValues: UpdatePolicyInput = {
        ...commonData,
        policyId,
        status: statusFromAction,
        changeSummary: values.changeSummary,
        ...(action === 'publish' && { publishedAt: new Date() }),
      };
      updatePolicyMutation.mutate(apiValues, {
        onSuccess: handleSuccess,
        onSettled: handleSettled,
      });
    } else {
      toast.error("Invalid operation: Cannot determine whether to create or update.");
      setSubmitType(null);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    submitType,
  };
}