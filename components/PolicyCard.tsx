import React from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle,
  Circle,
  Edit,
  Calendar,
  User,
  Clock,
  ExternalLink,
  Shield,
  Users,
  Lock,
  Globe,
  FileText,
  Briefcase,
  Heart,
  Scale,
} from "lucide-react";
import { PolicyCardData } from "../helpers/policyCardData";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Skeleton } from "./Skeleton";
import { useAuth } from "../helpers/useAuth";
import { useOrgNavigation } from "../helpers/useOrgNavigation";
import { PolicyDownloadButton } from "./PolicyDownloadButton";
import styles from "./PolicyCard.module.css";

type CategoryColor = "coral" | "blue" | "purple" | "green";

const getCategoryColor = (category?: string): CategoryColor => {
  if (!category) return "blue";
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes("health") || lowerCategory.includes("safety")) return "coral";
  if (lowerCategory.includes("employment") || lowerCategory.includes("hr")) return "blue";
  if (lowerCategory.includes("data") || lowerCategory.includes("privacy") || lowerCategory.includes("gdpr")) return "purple";
  if (lowerCategory.includes("communication") || lowerCategory.includes("social")) return "green";
  if (lowerCategory.includes("compliance") || lowerCategory.includes("legal")) return "purple";
  if (lowerCategory.includes("security")) return "coral";
  return "blue";
};

const getCategoryIcon = (category?: string) => {
  if (!category) return FileText;
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes("health") || lowerCategory.includes("safety")) return Heart;
  if (lowerCategory.includes("employment") || lowerCategory.includes("hr")) return Users;
  if (lowerCategory.includes("data") || lowerCategory.includes("privacy") || lowerCategory.includes("gdpr")) return Lock;
  if (lowerCategory.includes("communication") || lowerCategory.includes("social")) return Globe;
  if (lowerCategory.includes("compliance") || lowerCategory.includes("legal")) return Scale;
  if (lowerCategory.includes("security")) return Shield;
  if (lowerCategory.includes("work") || lowerCategory.includes("remote")) return Briefcase;
  return FileText;
};

interface PolicyCardProps {
  policy: PolicyCardData;
  className?: string;
  portalSlug?: string;
  showDescription?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
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

const formatReviewDate = (date: Date | string): string => {
  const reviewDate = new Date(date);
  return reviewDate.toLocaleDateString();
};

export const PolicyCard: React.FC<PolicyCardProps> = ({
  policy,
  className,
  portalSlug,
  showDescription = true,
  isSelectable = false,
  isSelected = false,
  onSelectionChange,
}) => {
  const { authState } = useAuth();
  const { buildUrl } = useOrgNavigation();
  const updatedAt = policy.updatedAt
    ? formatDistanceToNow(new Date(policy.updatedAt), { addSuffix: true })
    : "N/A";

  const isPortalView = Boolean(portalSlug);

  const canEdit = authState.type === "authenticated" &&
    (authState.user.role === "admin" || authState.user.role === "editor");

  const canDownload = authState.type === "authenticated" &&
    authState.user.role === "admin";

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Determine the target URL based on context
  // If portalSlug is provided, we are in a portal context
  // Otherwise, default to admin policy view
    const policyUrl = portalSlug
    ? buildUrl(`/${portalSlug}/${policy.id}`)
    : buildUrl(`/admin/policies/${policy.id}`);

  const editUrl = buildUrl(`/admin/policies/${policy.id}/edit`);

  const handleViewOnPortal = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!policy.assignedPortals || policy.assignedPortals.length === 0) {
      return;
    }

    // Use the first assigned portal
    const portal = policy.assignedPortals[0];
    const portalUrl = buildUrl(`/${portal.slug}/${policy.id}`);
    window.open(portalUrl, '_blank');
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectionChange?.(policy.id, !isSelected);
  };

  return (
    <div className={`${styles.cardWrapper} ${isSelected ? styles.selected : ""} ${className || ""}`}>
      {isSelectable && (
        <div
          className={styles.checkboxContainer}
          onClick={handleCheckboxClick}
        >
          <Checkbox
            checked={isSelected}
            readOnly
          />
        </div>
      )}
      <Link
        to={policyUrl}
        className={styles.card}
      >
        {!isPortalView && policy.status && (
          <div className={styles.statusBadge}>
            <Badge variant={getStatusVariant(policy.status)}>{policy.status}</Badge>
          </div>
        )}

        {(() => {
          const CategoryIcon = getCategoryIcon(policy.category);
          const colorClass = getCategoryColor(policy.category);
          return (
            <div className={`${styles.categoryIcon} ${styles[colorClass]}`}>
              <CategoryIcon size={24} />
            </div>
          );
        })()}

        <div className={styles.cardHeader}>
          <h3 className={styles.title}>{policy.title}</h3>
        </div>

        {showDescription && (
          <p className={styles.description}>
            Policy details and guidelines...
          </p>
        )}

        {policy.author && (
          <div className={styles.author}>
            <User size={14} className={styles.authorIcon} />
            <span className={styles.authorName}>{policy.author.displayName}</span>
          </div>
        )}

        {!isPortalView && (
          <div className={styles.metadata}>
            {policy.category && <Badge variant="outline">{policy.category}</Badge>}
            {policy.department && (
              <Badge variant="outline">{policy.department}</Badge>
            )}
            {policy.assignedPortals && policy.assignedPortals.length > 0 &&
              policy.assignedPortals.map((portal) => (
                <Badge key={portal.id} variant="secondary">{portal.name}</Badge>
              ))
            }
            {policy.reviewStatus && (
              <Badge variant={getReviewStatusVariant(policy.reviewStatus)}>
                {policy.reviewStatus === "overdue" && "Overdue"}
                {policy.reviewStatus === "due_soon" && "Due Soon"}
                {policy.reviewStatus === "upcoming" && "Upcoming"}
              </Badge>
            )}
          </div>
        )}

        {policy.reviewDate && (
          <div className={styles.reviewInfo}>
            <div className={styles.reviewDate}>
              <Calendar size={14} className={styles.reviewIcon} />
              <span>Review: {formatReviewDate(policy.reviewDate)}</span>
            </div>
            {(policy.daysOverdue !== undefined || policy.daysUntilDue !== undefined) && (
              <div className={styles.reviewTiming}>
                <Clock size={14} className={styles.reviewIcon} />
                {policy.daysOverdue !== undefined && policy.daysOverdue > 0 && (
                  <span className={styles.overdue}>{policy.daysOverdue} days overdue</span>
                )}
                {policy.daysUntilDue !== undefined && policy.daysUntilDue > 0 && policy.daysOverdue === 0 && (
                  <span className={styles.dueSoon}>Due in {policy.daysUntilDue} days</span>
                )}
              </div>
            )}
          </div>
        )}

        <div className={styles.cardFooter}>
          <div className={styles.status}>
            <span className={styles.updatedAt}>Updated {updatedAt}</span>
          </div>
          <div className={styles.footerActions}>
            {policy.requiresAcknowledgment && (
              <div className={styles.acknowledgment}>
                {policy.acknowledged ? (
                  <>
                    <CheckCircle size={16} className={styles.acknowledgedIcon} />
                    <span>Acknowledged</span>
                  </>
                ) : (
                  <>
                    <Circle size={16} className={styles.unacknowledgedIcon} />
                    <span>Pending</span>
                  </>
                )}
              </div>
            )}
            {!isPortalView && policy.assignedPortals && policy.assignedPortals.length > 0 && (
              <Button
                variant="ghost"
                size="icon-sm"
                className={styles.viewPortalButton}
                onClick={handleViewOnPortal}
                title="View on Portal"
              >
                <ExternalLink size={14} />
              </Button>
            )}
            {!isPortalView && canDownload && (
              <PolicyDownloadButton
                policyId={policy.id}
                policyTitle={policy.title}
                variant="icon"
                defaultFormat="docx"
                className={styles.downloadButton}
              />
            )}
            {!isPortalView && canEdit && (
              <Button
                asChild
                variant="ghost"
                size="icon-sm"
                className={styles.editButton}
                onClick={handleEditClick}
              >
                <Link to={editUrl}>
                  <Edit size={14} />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export const PolicyCardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div className={`${styles.card} ${styles.skeleton} ${className || ""}`}>
      <div className={styles.cardHeader}>
        <Skeleton style={{ width: "24px", height: "24px", borderRadius: "var(--radius-sm)" }} />
        <Skeleton style={{ height: "1.25rem", width: "80%" }} />
      </div>
      <div className={styles.metadata}>
        <Skeleton style={{ height: "1.5rem", width: "80px" }} />
        <Skeleton style={{ height: "1.5rem", width: "100px" }} />
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.status}>
          <Skeleton style={{ height: "1.5rem", width: "70px" }} />
          <Skeleton style={{ height: "1rem", width: "120px" }} />
        </div>
        <Skeleton style={{ height: "1.25rem", width: "90px" }} />
      </div>
    </div>
  );
};
