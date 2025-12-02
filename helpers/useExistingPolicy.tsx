import { usePolicyDetails } from './usePolicyApi';
import { Skeleton } from '../components/Skeleton';

/**
 * A hook for loading existing policy data for the edit form.
 * It encapsulates the data fetching logic, loading states, and error handling
 * when a form needs to be populated with data for an existing policy.
 *
 * @param {number | undefined} policyId - The ID of the policy to fetch. The hook is disabled if the ID is undefined.
 * @returns An object containing the policy data, loading state, and any fetch errors.
 */
export function useExistingPolicy(policyId: number | undefined) {
  const {
    data: policyDetails,
    isFetching,
    error,
  } = usePolicyDetails(policyId ?? 0, {
    // Enable the query only if a valid policyId is provided
    enabled: typeof policyId === 'number' && !isNaN(policyId),
  });

  return {
    policy: policyDetails?.policy,
    isFetching,
    error,
  };
}

/**
 * A skeleton loader component specifically for the policy form.
 * It mimics the layout of the form to provide a better loading experience.
 */
export const PolicyFormSkeleton = () => (
  <div style={{ padding: 'var(--spacing-8)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
    <Skeleton style={{ height: '2.5rem', width: '40%' }} />
    <Skeleton style={{ height: '2.5rem', width: '80%' }} />
    <Skeleton style={{ height: '20rem', width: '100%' }} />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
      <Skeleton style={{ height: '2.5rem' }} />
      <Skeleton style={{ height: '2.5rem' }} />
      <Skeleton style={{ height: '2.5rem' }} />
      <Skeleton style={{ height: '2.5rem' }} />
    </div>
  </div>
);