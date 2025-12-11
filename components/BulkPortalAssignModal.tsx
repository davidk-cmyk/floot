import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./Dialog";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { usePortals } from "../helpers/usePortalApi";
import { bulkAssignPoliciesToPortals } from "../endpoints/policies/bulk-assign-portals_POST.schema";
import { toast } from "sonner";
import styles from "./BulkPortalAssignModal.module.css";

interface BulkPortalAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPolicyIds: number[];
  onSuccess: () => void;
}

export const BulkPortalAssignModal: React.FC<BulkPortalAssignModalProps> = ({
  isOpen,
  onClose,
  selectedPolicyIds,
  onSuccess,
}) => {
  const [selectedPortalIds, setSelectedPortalIds] = useState<number[]>([]);
  const { data: portalsData, isLoading: portalsLoading } = usePortals({ page: 1, limit: 100 });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOpen) {
      setSelectedPortalIds([]);
    }
  }, [isOpen]);

  const assignMutation = useMutation({
    mutationFn: async () => {
      return bulkAssignPoliciesToPortals({
        policyIds: selectedPolicyIds,
        portalIds: selectedPortalIds,
      });
    },
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      queryClient.invalidateQueries({ queryKey: ["portals"] });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to assign policies to portals");
    },
  });

  const handlePortalToggle = (portalId: number) => {
    setSelectedPortalIds((prev) =>
      prev.includes(portalId)
        ? prev.filter((id) => id !== portalId)
        : [...prev, portalId]
    );
  };

  const handleSubmit = () => {
    if (selectedPortalIds.length === 0) {
      toast.error("Please select at least one portal");
      return;
    }
    assignMutation.mutate();
  };

  const portals = portalsData?.portals || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.modalContent}>
        <DialogHeader>
          <DialogTitle className={styles.title}>
            <FolderPlus size={20} />
            Assign {selectedPolicyIds.length}{" "}
            {selectedPolicyIds.length === 1 ? "Policy" : "Policies"} to Portals
          </DialogTitle>
          <DialogDescription>
            Select the portals you want to assign the selected policies to.
            Policies already assigned to a portal will not be duplicated.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.portalList}>
          {portalsLoading ? (
            <div className={styles.loading}>
              <Loader2 className={styles.spinner} size={24} />
              <span>Loading portals...</span>
            </div>
          ) : portals.length === 0 ? (
            <div className={styles.emptyState}>
              No portals available. Create a portal first.
            </div>
          ) : (
            portals.map((portal) => (
              <label key={portal.id} className={styles.portalItem}>
                <Checkbox
                  checked={selectedPortalIds.includes(portal.id)}
                  onChange={() => handlePortalToggle(portal.id)}
                />
                <div className={styles.portalInfo}>
                  <span className={styles.portalName}>{portal.name}</span>
                  {portal.accessType === "password" && (
                    <span className={styles.portalBadge}>Password protected</span>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={assignMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              selectedPortalIds.length === 0 ||
              assignMutation.isPending ||
              portalsLoading
            }
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className={styles.spinner} size={16} />
                Assigning...
              </>
            ) : (
              <>Assign to {selectedPortalIds.length} Portal{selectedPortalIds.length !== 1 ? "s" : ""}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
