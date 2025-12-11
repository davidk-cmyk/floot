import React from "react";
import { X, FolderPlus } from "lucide-react";
import { Button } from "./Button";
import styles from "./BulkActionsBar.module.css";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onAssignToPortal: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClearSelection,
  onAssignToPortal,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.bar}>
        <div className={styles.selectionInfo}>
          <span className={styles.count}>{selectedCount}</span>
          <span className={styles.label}>
            {selectedCount === 1 ? "policy" : "policies"} selected
          </span>
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            size="sm"
            onClick={onAssignToPortal}
          >
            <FolderPlus size={16} />
            Assign to Portal
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClearSelection}
          className={styles.closeButton}
          title="Clear selection"
        >
          <X size={18} />
        </Button>
      </div>
    </div>
  );
};
