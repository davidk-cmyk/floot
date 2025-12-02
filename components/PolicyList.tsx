import React from "react";
import { PolicyCard, PolicyCardSkeleton } from "./PolicyCard";
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
}

export const PolicyList: React.FC<PolicyListProps> = ({
  policies,
  isLoading,
  error,
  skeletonsCount = 12,
  className,
  portalSlug,
}) => {
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
        <PolicyCard key={policy.id} policy={policy} portalSlug={portalSlug} />
      ))}
    </div>
  );
};