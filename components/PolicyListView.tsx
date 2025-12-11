import React from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { FileText, Edit, CheckCircle, Circle } from "lucide-react";
import { PolicyCardData } from "../helpers/policyCardData";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Skeleton } from "./Skeleton";
import { useAuth } from "../helpers/useAuth";
import { useOrgNavigation } from "../helpers/useOrgNavigation";
import { PolicyDownloadButton } from "./PolicyDownloadButton";
import styles from "./PolicyListView.module.css";

interface PolicyListViewProps {
  policies?: PolicyCardData[];
  isLoading: boolean;
  error: Error | null;
  skeletonsCount?: number;
  className?: string;
  portalSlug?: string;
  isSelectable?: boolean;
  selectedPolicyIds?: number[];
  onSelectionChange?: (id: number, selected: boolean) => void;
}

const getStatusVariant = (
  status: string
): "success" | "warning" | "destructive" | "secondary" => {
  switch (status.toLowerCase()) {
    case "published":
      return "success";
    case "draft":
      return "secondary";
    case "archived":
      return "warning";
    default:
      return "secondary";
  }
};

const getReviewStatusVariant = (
  reviewStatus: "overdue" | "due_soon" | "upcoming"
): "destructive" | "warning" | "secondary" => {
  switch (reviewStatus) {
    case "overdue":
      return "destructive";
    case "due_soon":
      return "warning";
    case "upcoming":
      return "secondary";
  }
};

export const PolicyListView: React.FC<PolicyListViewProps> = ({
  policies,
  isLoading,
  error,
  skeletonsCount = 12,
  className,
  portalSlug,
  isSelectable = false,
  selectedPolicyIds = [],
  onSelectionChange,
}) => {
  const { authState } = useAuth();
  const { buildUrl } = useOrgNavigation();

  const canEdit = authState.type === "authenticated" && 
    (authState.user.role === "admin" || authState.user.role === "editor");

  const canDownload = authState.type === "authenticated" && 
    authState.user.role === "admin";

  if (isLoading) {
    return (
      <div className={`${styles.listContainer} ${className || ""}`}>
        {Array.from({ length: skeletonsCount }).map((_, index) => (
          <PolicyListRowSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.errorMessage}>
          There was a problem fetching the policies. Please try again later.
        </p>
      </div>
    );
  }

  if (!policies || policies.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>No policies found.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.listContainer} ${className || ""}`}>
      <div className={`${styles.listHeader} ${isSelectable ? styles.withCheckbox : ""}`}>
        {isSelectable && <div className={styles.checkboxCol}></div>}
        <div className={styles.titleCol}>Policy</div>
        <div className={styles.statusCol}>Status</div>
        <div className={styles.categoryCol}>Category</div>
        <div className={styles.updatedCol}>Updated</div>
        <div className={styles.actionsCol}>Actions</div>
      </div>
      {policies.map((policy) => {
        const policyUrl = portalSlug 
          ? buildUrl(`/${portalSlug}/${policy.id}`)
          : buildUrl(`/admin/policies/${policy.id}`);
        const editUrl = buildUrl(`/admin/policies/${policy.id}/edit`);
        const updatedAt = policy.updatedAt
          ? formatDistanceToNow(new Date(policy.updatedAt), { addSuffix: true })
          : "N/A";
        const isSelected = selectedPolicyIds.includes(policy.id);

        return (
          <Link
            key={policy.id}
            to={policyUrl}
            className={`${styles.row} ${isSelectable ? styles.withCheckbox : ""} ${isSelected ? styles.selected : ""}`}
          >
            {isSelectable && (
              <div 
                className={styles.checkboxCol}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (onSelectionChange) {
                      onSelectionChange(policy.id, e.target.checked);
                    }
                  }}
                />
              </div>
            )}
            <div className={styles.titleCol}>
              <div className={styles.titleContent}>
                <FileText className={styles.icon} />
                <div className={styles.titleWrapper}>
                  <h4 className={styles.title}>{policy.title}</h4>
                  {policy.author && (
                    <p className={styles.author}>by {policy.author.displayName}</p>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.statusCol}>
              {policy.status && (
                <Badge variant={getStatusVariant(policy.status)}>
                  {policy.status}
                </Badge>
              )}
            </div>

            <div className={styles.categoryCol}>
              <div className={styles.badges}>
                {policy.category && (
                  <Badge variant="outline">{policy.category}</Badge>
                )}
                {policy.department && (
                  <Badge variant="outline">{policy.department}</Badge>
                )}
              </div>
            </div>

            <div className={styles.updatedCol}>
              <span className={styles.updatedText}>{updatedAt}</span>
            </div>

            <div className={styles.actionsCol} onClick={(e) => e.preventDefault()}>
              <div className={styles.actionButtons}>
                {policy.requiresAcknowledgment && (
                  <div className={styles.acknowledgment}>
                    {policy.acknowledged ? (
                      <>
                        <CheckCircle size={16} className={styles.acknowledgedIcon} />
                        <span className={styles.acknowledgedText}>Acknowledged</span>
                      </>
                    ) : (
                      <>
                        <Circle size={16} className={styles.unacknowledgedIcon} />
                        <span className={styles.pendingText}>Pending</span>
                      </>
                    )}
                  </div>
                )}
                {canDownload && (
                  <PolicyDownloadButton
                    policyId={policy.id}
                    policyTitle={policy.title}
                    variant="icon"
                    defaultFormat="docx"
                  />
                )}
                {canEdit && (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-sm"
                  >
                    <Link to={editUrl}>
                      <Edit size={16} />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export const PolicyListRowSkeleton: React.FC = () => {
  return (
    <div className={`${styles.row} ${styles.skeleton}`}>
      <div className={styles.titleCol}>
        <div className={styles.titleContent}>
          <Skeleton style={{ width: "24px", height: "24px", borderRadius: "4px" }} />
          <div className={styles.titleWrapper}>
            <Skeleton style={{ height: "1rem", width: "200px" }} />
            <Skeleton style={{ height: "0.75rem", width: "100px", marginTop: "4px" }} />
          </div>
        </div>
      </div>
      <div className={styles.statusCol}>
        <Skeleton style={{ height: "1.5rem", width: "80px" }} />
      </div>
      <div className={styles.categoryCol}>
        <Skeleton style={{ height: "1.5rem", width: "120px" }} />
      </div>
      <div className={styles.updatedCol}>
        <Skeleton style={{ height: "1rem", width: "100px" }} />
      </div>
      <div className={styles.actionsCol}>
        <Skeleton style={{ height: "2rem", width: "80px" }} />
      </div>
    </div>
  );
};
