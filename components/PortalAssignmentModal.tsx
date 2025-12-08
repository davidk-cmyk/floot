import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './Dialog';
import { Button } from './Button';
import { PortalSelector } from './PortalSelector';
import { postPortalAssignments } from '../endpoints/portals/assignments_POST.schema';
import { toast } from 'sonner';
import styles from './PortalAssignmentModal.module.css';

interface PortalAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  policyId: number;
  policyTitle: string;
  onAssignmentComplete: () => void;
}

export const PortalAssignmentModal: React.FC<PortalAssignmentModalProps> = ({
  isOpen,
  onClose,
  policyId,
  policyTitle,
  onAssignmentComplete,
}) => {
  const [selectedPortalIds, setSelectedPortalIds] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const assignMutation = useMutation({
    mutationFn: async (portalIds: number[]) => {
      const results = await Promise.all(
        portalIds.map(portalId =>
          postPortalAssignments({
            portalId,
            assignments: [{ policyId, action: 'add' }],
          })
        )
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['portals'] });
      toast.success('Policy assigned to portal(s) successfully');
      onAssignmentComplete();
      handleClose();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Failed to assign policy: ${message}`);
    },
  });

  const handleClose = (clearSelections = true) => {
    if (clearSelections) {
      setSelectedPortalIds([]);
    }
    onClose();
  };

  const handleConfirm = () => {
    if (selectedPortalIds.length === 0) {
      toast.error('Please select at least one portal');
      return;
    }
    assignMutation.mutate(selectedPortalIds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle className={styles.title}>
            <Globe className={styles.titleIcon} />
            Assign Policy to Portal
          </DialogTitle>
          <DialogDescription className={styles.description}>
            Before publishing "{policyTitle}", please select which portal(s) it should appear on.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.selectorWrapper}>
          <PortalSelector
            selectedPortalIds={selectedPortalIds}
            onPortalIdsChange={setSelectedPortalIds}
            disabled={assignMutation.isPending}
          />
        </div>

        <DialogFooter className={styles.footer}>
          <Button
            variant="outline"
            onClick={() => handleClose(true)}
            disabled={assignMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={assignMutation.isPending || selectedPortalIds.length === 0}
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                Assigning...
              </>
            ) : (
              'Assign & Publish'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
