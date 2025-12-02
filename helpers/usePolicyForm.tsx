import { useEffect } from 'react';
import { useForm } from '../components/Form';
import { useAutosave } from './useAutosave';
import { universalPolicyFormSchema, UniversalPolicyFormValues } from './universalPolicyFormSchema';
import { PolicyWithAuthor } from '../endpoints/policies/get_POST.schema';

interface UsePolicyFormProps {
  mode: 'create' | 'edit';
  existingPolicy?: PolicyWithAuthor;
  policyId?: number;
}

const createDefaultValues: UniversalPolicyFormValues = {
  title: '',
  content: '',
  status: 'draft',
  effectiveDate: undefined,
  expirationDate: undefined,
  reviewDate: undefined,
  tags: [],
  department: '',
  category: '',
  changeSummary: '',
  requiresAcknowledgment: false,
  portalIds: [],
};

/**
 * Maps a fetched policy object to the format required by the form.
 * @param policy The policy data fetched from the API.
 * @returns Form values derived from the policy data.
 */
const getEditDefaultValues = (policy: PolicyWithAuthor): UniversalPolicyFormValues => ({
  title: policy.title,
  content: policy.content,
  status: policy.status,
  effectiveDate: policy.effectiveDate ? new Date(policy.effectiveDate) : undefined,
  expirationDate: policy.expirationDate ? new Date(policy.expirationDate) : undefined,
  reviewDate: policy.reviewDate ? new Date(policy.reviewDate) : undefined,
  tags: policy.tags || [],
  department: policy.department || '',
  category: policy.category || '',
  changeSummary: '', // Change summary is for the new version, so it starts empty
  requiresAcknowledgment: policy.requiresAcknowledgmentFromPortals,
  portalIds: policy.assignedPortals?.map(p => p.id) || [],
});

/**
 * A universal hook that handles form state management for both create and edit modes.
 * It initializes the form with appropriate default values, manages validation against a
 * unified schema, and integrates autosave functionality.
 *
 * @param {UsePolicyFormProps} props - The configuration for the hook, including mode and existing policy data.
 * @returns An object containing the form instance and the function to clear autosaved data.
 */
export function usePolicyForm({ mode, existingPolicy, policyId }: UsePolicyFormProps) {
  const isCreateMode = mode === 'create';

  const form = useForm({
    schema: universalPolicyFormSchema,
    defaultValues: isCreateMode ? createDefaultValues : (existingPolicy ? getEditDefaultValues(existingPolicy) : createDefaultValues),
  });

  // Reset form when switching between policies in edit mode
  useEffect(() => {
    if (mode === 'edit' && existingPolicy) {
      form.setValues(() => getEditDefaultValues(existingPolicy));
    }
  }, [existingPolicy, mode, form.setValues]);

  const autosaveStorageKey = isCreateMode
    ? 'policy-draft-autosave-new'
    : `policy-draft-autosave-${policyId}`;

  const { clearAutosavedData } = useAutosave<UniversalPolicyFormValues>({
    values: form.values,
    storageKey: autosaveStorageKey,
    onRestore: (data) => {
      // Only restore in create mode to avoid overwriting existing data in edit mode
      if (isCreateMode) {
        form.setValues(() => data);
      }
    },
    enabled: true,
  });

  return { form, clearAutosavedData };
}