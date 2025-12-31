import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, Loader2, Minus } from "lucide-react";
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
import { postPortalAssignments } from "../endpoints/portals/assignments_POST.schema";
import { queryKeys } from "../helpers/queryKeys";
import { toast } from "sonner";
import styles from "./BulkPortalAssignModal.module.css";

type AssignedPortal = {
  id: number;
  name: string;
  slug: string;
  requiresAcknowledgment: boolean;
};

type PolicyWithAssignedPortals = {
  id: number;
  assignedPortals?: AssignedPortal[];
};

interface BulkPortalAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPolicyIds: number[];
  selectedPolicies?: PolicyWithAssignedPortals[];
  onSuccess: () => void;
}

type PortalState = "checked" | "unchecked" | "indeterminate";

export const BulkPortalAssignModal: React.FC<BulkPortalAssignModalProps> = ({
  isOpen,
  onClose,
  selectedPolicyIds,
  selectedPolicies = [],
  onSuccess,
}) => {
  const [portalStates, setPortalStates] = useState<Map<number, PortalState>>(new Map());
  const [initialPortalStates, setInitialPortalStates] = useState<Map<number, PortalState>>(new Map());
  const { data: portalsData, isLoading: portalsLoading } = usePortals({ page: 1, limit: 100 });
  const queryClient = useQueryClient();
  const checkboxRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const calculateInitialStates = useCallback(() => {
    if (!portalsData?.portals) {
      return new Map<number, PortalState>();
    }

    const states = new Map<number, PortalState>();
    const totalPolicies = selectedPolicies.length;

    for (const portal of portalsData.portals) {
      if (totalPolicies === 0) {
        states.set(portal.id, "unchecked");
        continue;
      }

      let assignedCount = 0;
      
      for (const policy of selectedPolicies) {
        const isAssigned = policy.assignedPortals?.some(ap => ap.id === portal.id) ?? false;
        if (isAssigned) {
          assignedCount++;
        }
      }

      if (assignedCount === 0) {
        states.set(portal.id, "unchecked");
      } else if (assignedCount === totalPolicies) {
        states.set(portal.id, "checked");
      } else {
        states.set(portal.id, "indeterminate");
      }
    }

    return states;
  }, [portalsData?.portals, selectedPolicies]);

  useEffect(() => {
    if (isOpen && portalsData?.portals) {
      const states = calculateInitialStates();
      setPortalStates(new Map(states));
      setInitialPortalStates(new Map(states));
    } else if (!isOpen) {
      setPortalStates(new Map());
      setInitialPortalStates(new Map());
    }
  }, [isOpen, portalsData?.portals, selectedPolicies, calculateInitialStates]);

  useEffect(() => {
    checkboxRefs.current.forEach((checkbox, portalId) => {
      if (checkbox) {
        const state = portalStates.get(portalId);
        checkbox.indeterminate = state === "indeterminate";
      }
    });
  }, [portalStates]);

  const assignMutation = useMutation({
    mutationFn: async () => {
      const results: Array<{ portalId: number; addedCount: number; removedCount: number }> = [];
      
      for (const [portalId, newState] of portalStates.entries()) {
        const initialState = initialPortalStates.get(portalId);
        
        if (newState === initialState) continue;
        if (newState === "indeterminate") continue;

        const assignments: Array<{ policyId: number; action: "add" | "remove" }> = [];

        if (newState === "checked") {
          for (const policy of selectedPolicies) {
            const wasAssigned = policy.assignedPortals?.some(ap => ap.id === portalId) ?? false;
            if (!wasAssigned) {
              assignments.push({ policyId: policy.id, action: "add" });
            }
          }
        } else if (newState === "unchecked") {
          for (const policy of selectedPolicies) {
            const wasAssigned = policy.assignedPortals?.some(ap => ap.id === portalId) ?? false;
            if (wasAssigned) {
              assignments.push({ policyId: policy.id, action: "remove" });
            }
          }
        }

        if (assignments.length > 0) {
          const result = await postPortalAssignments({ portalId, assignments });
          results.push({ portalId, addedCount: result.addedCount, removedCount: result.removedCount });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const totalAdded = results.reduce((sum, r) => sum + r.addedCount, 0);
      const totalRemoved = results.reduce((sum, r) => sum + r.removedCount, 0);
      
      const messages: string[] = [];
      if (totalAdded > 0) {
        messages.push(`${totalAdded} assignment${totalAdded !== 1 ? "s" : ""} added`);
      }
      if (totalRemoved > 0) {
        messages.push(`${totalRemoved} assignment${totalRemoved !== 1 ? "s" : ""} removed`);
      }
      
      if (messages.length > 0) {
        toast.success(messages.join(", "));
      } else {
        toast.info("No changes were made");
      }
      
      queryClient.invalidateQueries({ queryKey: queryKeys.policies.list() });
      for (const [portalId] of portalStates.entries()) {
        queryClient.invalidateQueries({ queryKey: queryKeys.portals.assignments(portalId) });
      }
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update portal assignments");
    },
  });

  const handlePortalToggle = (portalId: number) => {
    setPortalStates((prev) => {
      const newStates = new Map(prev);
      const currentState = prev.get(portalId) || "unchecked";
      
      if (currentState === "checked") {
        newStates.set(portalId, "unchecked");
      } else {
        newStates.set(portalId, "checked");
      }
      
      return newStates;
    });
  };

  const handleSubmit = () => {
    assignMutation.mutate();
  };

  const hasChanges = useMemo(() => {
    for (const [portalId, newState] of portalStates.entries()) {
      const initialState = initialPortalStates.get(portalId);
      if (newState !== initialState && newState !== "indeterminate") {
        return true;
      }
    }
    return false;
  }, [portalStates, initialPortalStates]);

  const changesSummary = useMemo(() => {
    let toAdd = 0;
    let toRemove = 0;

    for (const [portalId, newState] of portalStates.entries()) {
      const initialState = initialPortalStates.get(portalId);
      if (newState === initialState || newState === "indeterminate") continue;

      if (newState === "checked") {
        for (const policy of selectedPolicies) {
          const wasAssigned = policy.assignedPortals?.some(ap => ap.id === portalId) ?? false;
          if (!wasAssigned) toAdd++;
        }
      } else if (newState === "unchecked") {
        for (const policy of selectedPolicies) {
          const wasAssigned = policy.assignedPortals?.some(ap => ap.id === portalId) ?? false;
          if (wasAssigned) toRemove++;
        }
      }
    }

    return { toAdd, toRemove };
  }, [portalStates, initialPortalStates, selectedPolicies]);

  const portals = portalsData?.portals || [];

  const setCheckboxRef = (portalId: number) => (el: HTMLInputElement | null) => {
    if (el) {
      checkboxRefs.current.set(portalId, el);
      const state = portalStates.get(portalId);
      el.indeterminate = state === "indeterminate";
    } else {
      checkboxRefs.current.delete(portalId);
    }
  };

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
            portals.map((portal) => {
              const state = portalStates.get(portal.id) || "unchecked";
              return (
                <label key={portal.id} className={styles.portalItem}>
                  <div className={styles.checkboxContainer}>
                    <Checkbox
                      ref={setCheckboxRef(portal.id)}
                      checked={state === "checked"}
                      onChange={() => handlePortalToggle(portal.id)}
                    />
                    {state === "indeterminate" && (
                      <div className={styles.indeterminateIcon}>
                        <Minus size={12} />
                      </div>
                    )}
                  </div>
                  <div className={styles.portalInfo}>
                    <span className={styles.portalName}>{portal.name}</span>
                    {portal.accessType === "password" && (
                      <span className={styles.portalBadge}>Password protected</span>
                    )}
                    {state === "indeterminate" && (
                      <span className={styles.partialBadge}>Partially assigned</span>
                    )}
                  </div>
                </label>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={assignMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || assignMutation.isPending || portalsLoading}
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className={styles.spinner} size={16} />
                Updating...
              </>
            ) : hasChanges ? (
              <>
                Save Changes
                {(changesSummary.toAdd > 0 || changesSummary.toRemove > 0) && (
                  <span className={styles.changeCount}>
                    {changesSummary.toAdd > 0 && `+${changesSummary.toAdd}`}
                    {changesSummary.toAdd > 0 && changesSummary.toRemove > 0 && " / "}
                    {changesSummary.toRemove > 0 && `-${changesSummary.toRemove}`}
                  </span>
                )}
              </>
            ) : (
              "No Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
