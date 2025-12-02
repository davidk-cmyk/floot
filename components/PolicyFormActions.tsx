import React from 'react';
import { Button } from './Button';
import { Save, Send, Globe, Clock } from 'lucide-react';
import { useAuth } from '../helpers/useAuth';
import styles from './PolicyFormActions.module.css';

interface PolicyFormActionsProps {
  onSaveDraft: () => void;
  onSubmitForApproval: () => void;
  onPublishNow: () => void;
  isSubmitting: boolean;
  submitType: 'draft' | 'approval' | 'publish' | null;
  className?: string;
}

export const PolicyFormActions: React.FC<PolicyFormActionsProps> = ({
  onSaveDraft,
  onSubmitForApproval,
  onPublishNow,
  isSubmitting,
  submitType,
  className,
}) => {
  const { authState } = useAuth();

  if (authState.type !== 'authenticated') {
    return null;
  }

  const { user } = authState;
  const isAdmin = user.role === 'admin';
  const isEditor = user.role === 'editor';
  const isApprover = user.role === 'approver';

  // Determine which actions are available based on user role
  const canSaveDraft = isAdmin || isEditor;
  // TODO: Submit for Approval workflow is not properly thought out - intentionally hidden from UI
  // Users should not interact with this feature until the approval workflow is complete and fully designed
  const canSubmitForApproval = false;
  const canPublishDirectly = isAdmin || isApprover;

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.actions}>
        {canSaveDraft && (
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            disabled={isSubmitting}
            aria-label="Save policy as draft"
          >
            {isSubmitting && submitType === 'draft' ? (
              <>
                <Clock size={16} />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save as Draft
              </>
            )}
          </Button>
        )}

        {canSubmitForApproval && (
          <Button
            type="button"
            variant="secondary"
            onClick={onSubmitForApproval}
            disabled={isSubmitting}
            aria-label="Submit policy for approval"
          >
            {isSubmitting && submitType === 'approval' ? (
              <>
                <Clock size={16} />
                Submitting...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit for Approval
              </>
            )}
          </Button>
        )}

        {canPublishDirectly && (
          <Button
            type="button"
            onClick={onPublishNow}
            disabled={isSubmitting}
            aria-label="Publish policy immediately"
          >
            {isSubmitting && submitType === 'publish' ? (
              <>
                <Clock size={16} />
                Publishing...
              </>
            ) : (
              <>
                <Globe size={16} />
                Publish Now
              </>
            )}
          </Button>
        )}
      </div>

      <div className={styles.roleInfo}>
        <span className={styles.roleLabel}>Role:</span>
        <span className={styles.roleValue}>{user.role}</span>
      </div>
    </div>
  );
};