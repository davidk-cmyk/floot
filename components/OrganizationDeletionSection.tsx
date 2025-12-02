import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from './Button';
import { Input } from './Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './Dialog';
import { useAuth, AUTH_QUERY_KEY } from '../helpers/useAuth';
import { postOrganizationsDelete } from '../endpoints/organizations/delete_POST.schema';
import { ORGANIZATION_QUERY_KEY } from '../helpers/useOrganizationApi';
import styles from './OrganizationDeletionSection.module.css';

interface Organization {
  id: number;
  name: string;
}

interface OrganizationDeletionSectionProps {
  organization: Organization;
  className?: string;
}

export const OrganizationDeletionSection = ({
  organization,
  className,
}: OrganizationDeletionSectionProps) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const deleteMutation = useMutation({
    mutationFn: postOrganizationsDelete,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: [ORGANIZATION_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      // After successful deletion, the user's session might be invalid
      // or they might not have access to any other org. Logging out is safest.
      logout().then(() => navigate('/login'));
    },
    onError: (error) => {
      toast.error(error.message);
      setIsDialogOpen(false);
    },
  });

  const isButtonDisabled =
    !isConfirmed || confirmationText !== organization.name;

  const handleDelete = () => {
    if (isButtonDisabled) return;
    setIsDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate({ organizationId: organization.id });
  };

  const dataToDelete = [
    'All Users & Permissions',
    'All Policies & Versions',
    'All Portals & Settings',
    'All Acknowledgement Records',
    'Full Audit History',
    'All Other Associated Data',
  ];

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <AlertTriangle className={styles.icon} />
        <h3 className={styles.title}>Delete Organization</h3>
      </div>
      <p className={styles.warningText}>
        This action is irreversible and will permanently delete the{' '}
        <strong>{organization.name}</strong> organization. All associated data
        will be lost forever.
      </p>

      <div className={styles.dataListContainer}>
        <p className={styles.dataListTitle}>
          This will permanently delete:
        </p>
        <ul className={styles.dataList}>
          {dataToDelete.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className={styles.confirmationSteps}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className={styles.checkbox}
          />
          I understand this action is permanent and cannot be undone.
        </label>

        <div className={styles.inputGroup}>
          <label htmlFor="org-name-confirm" className={styles.inputLabel}>
            To confirm, please type{' '}
            <strong className={styles.orgName}>{organization.name}</strong>{' '}
            below:
          </label>
          <Input
            id="org-name-confirm"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Enter organization name"
            disabled={deleteMutation.isPending}
          />
        </div>
      </div>

      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={isButtonDisabled || deleteMutation.isPending}
        className={styles.deleteButton}
      >
        {deleteMutation.isPending ? (
          <>
            <Loader2 className={styles.spinner} />
            Deleting...
          </>
        ) : (
          'Delete this Organization'
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This is your final confirmation. Deleting the{' '}
              <strong>{organization.name}</strong> organization cannot be
              undone. All data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="secondary"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className={styles.spinner} />
                  Deleting...
                </>
              ) : (
                'Yes, delete organization'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};