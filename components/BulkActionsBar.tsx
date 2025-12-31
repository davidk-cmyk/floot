import React from "react";
import { X, FolderPlus, CheckSquare, Trash2 } from "lucide-react";
import { Button } from "./Button";
import styles from "./BulkActionsBar.module.css";

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onAssignToPortal: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onAssignToPortal,
  onDelete,
  canDelete = false,
}) => {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className={styles.container}>
      <div className={styles.bar}>
        <div className={styles.selectionInfo}>
          <span className={styles.count}>{selectedCount}</span>
          <span className={styles.label}>
            {selectedCount === 1 ? "policy" : "policies"} selected
          </span>
          {!allSelected && totalCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className={styles.selectAllButton}
            >
              <CheckSquare size={14} />
              Select all {totalCount}
            </Button>
          )}
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
          {canDelete && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 size={16} />
              Delete
            </Button>
          )}
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
