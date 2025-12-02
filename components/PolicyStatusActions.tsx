import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Rocket, CircleSlash } from 'lucide-react';
import { useAuth } from '../helpers/useAuth';
import { useUpdatePolicy } from '../helpers/usePolicyApi';
import { POLICIES_QUERY_KEY } from '../helpers/policyQueryKeys';
import { Button } from './Button';
import { PolicyWithAuthor } from '../endpoints/policies/get_POST.schema';
import styles from './PolicyStatusActions.module.css';

interface PolicyStatusActionsProps {
  policy: PolicyWithAuthor;
  className?: string;
}

export const PolicyStatusActions = ({ policy, className }: PolicyStatusActionsProps) => {
  const { authState } = useAuth();
  const queryClient = useQueryClient();
  const { mutate: updatePolicy, isPending } = useUpdatePolicy();

  const canPerformAction =
    authState.type === 'authenticated' &&
    (authState.user.role === 'admin' || authState.user.role === 'approver');

  if (!canPerformAction) {
    return null;
  }

  const handlePublish = () => {
    updatePolicy(
      {
        policyId: policy.id,
        status: 'published',
        publishedAt: new Date(),
        changeSummary: 'Policy published',
      },
      {
        onSuccess: () => {
          toast.success('Policy has been published.');
          queryClient.invalidateQueries({
            queryKey: [POLICIES_QUERY_KEY, 'details', policy.id],
          });
        },
        onError: (error) => {
          console.error('Failed to publish policy:', error);
          // The hook already shows a generic error toast.
        },
      },
    );
  };

  const handleUnpublish = () => {
    updatePolicy(
      {
        policyId: policy.id,
        status: 'draft',
        publishedAt: null,
        changeSummary: 'Policy unpublished and returned to draft status',
      },
      {
        onSuccess: () => {
          toast.success('Policy has been unpublished.');
          queryClient.invalidateQueries({
            queryKey: [POLICIES_QUERY_KEY, 'details', policy.id],
          });
        },
        onError: (error) => {
          console.error('Failed to unpublish policy:', error);
        },
      },
    );
  };

  const containerClasses = `${styles.container} ${className || ''}`;

  if (policy.status === 'draft') {
    return (
      <div className={containerClasses}>
        <Button onClick={handlePublish} disabled={isPending} size="lg">
          <Rocket size={16} />
          {isPending ? 'Publishing...' : 'Publish Policy'}
        </Button>
      </div>
    );
  }

  if (policy.status === 'published') {
    return (
      <div className={containerClasses}>
        <Button
          variant="secondary"
          onClick={handleUnpublish}
          disabled={isPending}
          size="lg"
        >
          <CircleSlash size={16} />
          {isPending ? 'Unpublishing...' : 'Unpublish Policy'}
        </Button>
      </div>
    );
  }

  return null;
};