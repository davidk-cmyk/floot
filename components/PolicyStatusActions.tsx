import React, { useState, useEffect } from 'react';
import { Rocket, CircleSlash } from 'lucide-react';
import { useAuth } from '../helpers/useAuth';
import { useUpdatePolicy } from '../helpers/usePolicyApi';
import { Button } from './Button';
import { PolicyWithAuthor } from '../endpoints/policies/get_POST.schema';
import { PortalAssignmentModal } from './PortalAssignmentModal';
import styles from './PolicyStatusActions.module.css';

interface PolicyStatusActionsProps {
  policy: PolicyWithAuthor;
  className?: string;
}

export const PolicyStatusActions = ({ policy, className }: PolicyStatusActionsProps) => {
  const { authState } = useAuth();
  const { mutate: updatePolicy, isPending } = useUpdatePolicy();
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [justAssignedPortals, setJustAssignedPortals] = useState(false);

  useEffect(() => {
    const hasPortals = policy.assignedPortals && policy.assignedPortals.length > 0;
    if (!hasPortals) {
      setJustAssignedPortals(false);
    }
  }, [policy.assignedPortals]);

  const canPerformAction =
    authState.type === 'authenticated' &&
    (authState.user.role === 'admin' || authState.user.role === 'approver');

  if (!canPerformAction) {
    return null;
  }

  const hasAssignedPortals = policy.assignedPortals && policy.assignedPortals.length > 0;

  const handlePublishClick = () => {
    if (!hasAssignedPortals && !justAssignedPortals) {
      setShowPortalModal(true);
    } else {
      doPublish();
    }
  };

  const doPublish = () => {
    updatePolicy({
      policyId: policy.id,
      status: 'published',
      publishedAt: new Date(),
      changeSummary: 'Policy published',
    });
  };

  const handleUnpublish = () => {
    updatePolicy({
      policyId: policy.id,
      status: 'draft',
      publishedAt: null,
      changeSummary: 'Policy unpublished and returned to draft status',
    });
  };

  const handleAssignmentComplete = () => {
    setJustAssignedPortals(true);
    setShowPortalModal(false);
    doPublish();
  };

  const containerClasses = `${styles.container} ${className || ''}`;

  if (policy.status === 'draft') {
    return (
      <>
        <div className={containerClasses}>
          <Button onClick={handlePublishClick} disabled={isPending} size="lg">
            <Rocket size={16} />
            {isPending ? 'Publishing...' : 'Publish Policy'}
          </Button>
        </div>
        <PortalAssignmentModal
          isOpen={showPortalModal}
          onClose={() => setShowPortalModal(false)}
          policyId={policy.id}
          policyTitle={policy.title}
          onAssignmentComplete={handleAssignmentComplete}
        />
      </>
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
