import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./Dialog";
import { Button } from "./Button";
import { bulkDeletePolicies } from "../endpoints/policies/bulk-delete_POST.schema";
import { queryKeys } from "../helpers/queryKeys";
import { toast } from "sonner";
import styles from "./BulkDeleteModal.module.css";

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPolicyIds: number[];
  onSuccess: () => void;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  onClose,
  selectedPolicyIds,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return bulkDeletePolicies({
        policyIds: selectedPolicyIds,
      });
    },
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.policies.list() });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete policies");
    },
  });

  const handleConfirm = () => {
    deleteMutation.mutate();
  };

  const policyCount = selectedPolicyIds.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.modalContent}>
        <DialogHeader>
          <DialogTitle className={styles.title}>
            <AlertTriangle size={20} className={styles.warningIcon} />
            Delete {policyCount} {policyCount === 1 ? "Policy" : "Policies"}
          </DialogTitle>
          <DialogDescription className={styles.description}>
            Are you sure you want to delete {policyCount === 1 ? "this policy" : `these ${policyCount} policies`}?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.warningBox}>
          <AlertTriangle size={16} />
          <div>
            <strong>This will permanently delete:</strong>
            <ul className={styles.warningList}>
              <li>All policy content and versions</li>
              <li>All acknowledgment records</li>
              <li>All portal assignments</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className={styles.spinner} size={16} />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete {policyCount} {policyCount === 1 ? "Policy" : "Policies"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
