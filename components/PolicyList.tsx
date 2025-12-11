import React from "react";
import { PolicyCard, PolicyCardSkeleton } from "./PolicyCard";
import { PolicyListView, PolicyListRowSkeleton } from "./PolicyListView";
import { PolicyCardData } from "../helpers/policyCardData";
import { Frown, AlertCircle } from "lucide-react";
import styles from "./PolicyList.module.css";

interface PolicyListProps {
  policies?: PolicyCardData[];
  isLoading: boolean;
  error: Error | null;
  skeletonsCount?: number;
  className?: string;
  portalSlug?: string;
  viewMode?: "grid" | "list";
  isSelectable?: boolean;
  selectedPolicyIds?: number[];
  onSelectionChange?: (id: number, selected: boolean) => void;
}

export const PolicyList: React.FC<PolicyListProps> = ({
  policies,
  isLoading,
  error,
  skeletonsCount = 12,
  className,
  portalSlug,
  viewMode = "grid",
  isSelectable = false,
  selectedPolicyIds = [],
  onSelectionChange,
}) => {
  if (viewMode === "list") {
    return (
      <PolicyListView
        policies={policies}
        isLoading={isLoading}
        error={error}
        skeletonsCount={skeletonsCount}
        className={className}
        portalSlug={portalSlug}
        isSelectable={isSelectable}
        selectedPolicyIds={selectedPolicyIds}
        onSelectionChange={onSelectionChange}
      />
    );
  }

  // Grid view (original behavior)
  if (isLoading) {
    return (
      <div className={`${styles.grid} ${className || ""}`}>
        {Array.from({ length: skeletonsCount }).map((_, index) => (
          <PolicyCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.emptyState}>
        <AlertCircle size={48} className={styles.errorIcon} />
        <h3 className={styles.emptyTitle}>Error Loading Policies</h3>
        <p className={styles.emptyText}>
          There was a problem fetching the policies. Please try again later.
        </p>
        <p className={styles.errorMessage}>{error.message}</p>
      </div>
    );
  }

  if (!policies || policies.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Frown size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>No Policies Found</h3>
        <p className={styles.emptyText}>
          No policies match your current search and filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.grid} ${className || ""}`}>
      {policies.map((policy) => (
        <PolicyCard
          key={policy.id}
          policy={policy}
          portalSlug={portalSlug}
          isSelectable={isSelectable}
          isSelected={selectedPolicyIds.includes(policy.id)}
          onSelectionChange={onSelectionChange}
        />
      ))}
    </div>
  );
};