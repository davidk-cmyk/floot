import React, { useState, useMemo, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postPortalAssignments } from '../endpoints/portals/assignments_POST.schema';
import { useAllPolicies } from '../helpers/usePolicyApi';
import { useAllPortalAssignments, PORTAL_ASSIGNMENTS_QUERY_KEY } from '../helpers/usePortalAssignments';
import { Input } from './Input';
import { Checkbox } from './Checkbox';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import styles from './PortalPolicyAssignment.module.css';
import { Selectable } from 'kysely';
import { Policies } from '../helpers/schema';

type PortalPolicyAssignmentProps = {
  portalId: number;
  onSuccess?: () => void;
  className?: string;
};

// Memoized policy item component to prevent unnecessary re-renders
const PolicyItem = memo<{
  policy: Selectable<Policies>;
  isSelected: boolean;
  onToggle: (policyId: number, checked: boolean) => void;
}>(({ policy, isSelected, onToggle }) => {
  const checkboxId = `policy-${policy.id}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(policy.id, e.target.checked);
  };

  return (
    <div className={styles.policyItem}>
      <Checkbox
        id={checkboxId}
        checked={isSelected}
        onChange={handleChange}
      />
      <label htmlFor={checkboxId} className={styles.policyLabel}>
        {policy.title}
      </label>
    </div>
  );
});

PolicyItem.displayName = 'PolicyItem';

const useUpdatePortalAssignments = (portalId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyIds, initialPolicyIds }: { policyIds: number[]; initialPolicyIds: number[] }) => {
      // Generate add/remove actions by comparing current selection with initial state
      const toAdd = policyIds.filter(id => !initialPolicyIds.includes(id));
      const toRemove = initialPolicyIds.filter(id => !policyIds.includes(id));
      
      const assignments = [
        ...toAdd.map(policyId => ({ policyId, action: 'add' as const })),
        ...toRemove.map(policyId => ({ policyId, action: 'remove' as const }))
      ];
      
      return postPortalAssignments({ portalId, assignments });
    },
    onSuccess: () => {
      toast.success('Policy assignments updated successfully.');
      queryClient.invalidateQueries({ queryKey: [PORTAL_ASSIGNMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['portals', 'list'] }); // To update policy count
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Failed to update assignments: ${message}`);
    },
  });
};

export const PortalPolicyAssignment: React.FC<PortalPolicyAssignmentProps> = ({ portalId, onSuccess, className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<Set<number>>(new Set());
  const [initialPolicyIds, setInitialPolicyIds] = useState<number[]>([]);

  const { data: allPoliciesData, isFetching: isLoadingPolicies, error: policiesError } = useAllPolicies();
  const { data: assignedPoliciesData, isFetching: isLoadingAssignments, error: assignmentsError } = useAllPortalAssignments(portalId);
  const updateAssignmentsMutation = useUpdatePortalAssignments(portalId);

  // Update selected policies when assignments are loaded
  useEffect(() => {
    if (assignedPoliciesData && !assignmentsError) {
      const initialIds = assignedPoliciesData.policies.map((p: Selectable<Policies>) => p.id);
      setInitialPolicyIds(initialIds);
      setSelectedPolicyIds(new Set(initialIds));
    }
  }, [assignedPoliciesData, assignmentsError]);

  // Memoized filtered policies list
  const filteredPolicies = useMemo(() => {
    if (!allPoliciesData || policiesError) return [];
    
    if (!searchTerm.trim()) {
      return allPoliciesData.policies;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return allPoliciesData.policies.filter((policy: Selectable<Policies>) =>
      policy.title.toLowerCase().includes(searchLower)
    );
  }, [allPoliciesData, searchTerm, policiesError]);

  // Optimized toggle handler - uses checked parameter to avoid toggle issues
  const handleTogglePolicy = useMemo(() => (policyId: number, checked: boolean) => {
    setSelectedPolicyIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(policyId);
      } else {
        newSet.delete(policyId);
      }
      return newSet;
    });
  }, []);

  // Check if there are changes to save
  const hasChanges = useMemo(() => {
    const currentIds = Array.from(selectedPolicyIds).sort();
    const initialIds = [...initialPolicyIds].sort();
    
    if (currentIds.length !== initialIds.length) return true;
    return !currentIds.every((id, index) => id === initialIds[index]);
  }, [selectedPolicyIds, initialPolicyIds]);

  const handleSave = () => {
    if (!hasChanges) {
      toast.info('No changes to save.');
      return;
    }

    updateAssignmentsMutation.mutate(
      { 
        policyIds: Array.from(selectedPolicyIds), 
        initialPolicyIds 
      }, 
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  // Handle error states
  if (policiesError || assignmentsError) {
      const errorMessage = policiesError
    ? `Failed to load policies: ${policiesError.message}`
    : assignmentsError
    ? `Failed to load current assignments: ${assignmentsError.message}`
    : 'Failed to load data';
    
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.errorState}>
          <AlertTriangle className={styles.errorIcon} size={24} />
          <div className={styles.errorMessage}>
            <h4>Unable to load policy assignments</h4>
            <p>{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = isLoadingPolicies || isLoadingAssignments;

  const renderPolicyList = () => {
    if (isLoading) {
      return Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.skeletonItem}>
          <Skeleton style={{ height: '1.25rem', width: '1.25rem', borderRadius: 'var(--radius-sm)' }} />
          <Skeleton style={{ height: '1.25rem', width: '80%' }} />
        </div>
      ));
    }

    if (!filteredPolicies.length) {
      // Check if there are no policies at all vs no search matches
      const noPoliciesExist = !allPoliciesData?.policies?.length;
      
      if (noPoliciesExist) {
        return (
          <div className={styles.emptyState}>
            <div>No policies found.</div>
            <div className={styles.emptyStateMessage}>
              You haven't created any policies yet. Create your first policy to assign it to this portal.
            </div>
            <Link to="/admin/policies" className={styles.emptyStateLink}>
              Create a new policy
            </Link>
          </div>
        );
      }
      
      const message = searchTerm.trim() 
        ? `No policies found matching "${searchTerm}"`
        : 'No policies found.';
      return <div className={styles.emptyState}>{message}</div>;
    }

    return filteredPolicies.map((policy: Selectable<Policies>) => (
      <PolicyItem
        key={policy.id}
        policy={policy}
        isSelected={selectedPolicyIds.has(policy.id)}
        onToggle={handleTogglePolicy}
      />
    ));
  };

  const selectedCount = selectedPolicyIds.size;
  const totalCount = allPoliciesData?.policies?.length || 0;

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} size={18} />
        <Input
          type="text"
          placeholder="Search policies..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          disabled={isLoading}
        />
      </div>

      {!isLoading && (
        <div className={styles.summary}>
          {selectedCount} of {totalCount} policies selected
        </div>
      )}

      <div className={styles.policyList}>
        {renderPolicyList()}
      </div>

      <div className={styles.footer}>
        <Button 
          onClick={handleSave} 
          disabled={updateAssignmentsMutation.isPending || isLoading || !hasChanges}
        >
          {updateAssignmentsMutation.isPending ? 'Saving...' : 'Save Assignments'}
        </Button>
      </div>
    </div>
  );
};