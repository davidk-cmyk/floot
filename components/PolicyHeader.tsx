import React from 'react';
import { format } from 'date-fns';
import { PolicyWithAuthor } from '../endpoints/policies/get_POST.schema';
import { useSettings } from '../helpers/useSettingsApi';
import { useUserLookup } from '../helpers/useUserLookup';
import { Badge } from './Badge';
import { UserAvatar } from './UserAvatar';
import { Calendar, ShieldCheck, Tag } from 'lucide-react';
import styles from './PolicyHeader.module.css';

interface PolicyHeaderProps {
  policy: PolicyWithAuthor;
  className?: string;
  hideMetadata?: boolean;
  hideAuthor?: boolean;
}

const SETTING_KEYS = {
  INCLUDE_DATE_CREATED: "policyDocument.includeDateCreated",
  INCLUDE_DATE_REVIEWED: "policyDocument.includeDateReviewed",
  INCLUDE_DATE_APPROVED: "policyDocument.includeDateApproved",
  INCLUDE_AUTHOR: "policyDocument.includeAuthor",
  INCLUDE_REVIEWER: "policyDocument.includeReviewer",
  INCLUDE_APPROVER: "policyDocument.includeApprover",
};

export const PolicyHeader: React.FC<PolicyHeaderProps> = ({ policy, className, hideMetadata, hideAuthor }) => {
  // Fetch settings
  const includeDateCreatedQuery = useSettings(SETTING_KEYS.INCLUDE_DATE_CREATED);
  const includeDateReviewedQuery = useSettings(SETTING_KEYS.INCLUDE_DATE_REVIEWED);
  const includeDateApprovedQuery = useSettings(SETTING_KEYS.INCLUDE_DATE_APPROVED);
  const includeAuthorQuery = useSettings(SETTING_KEYS.INCLUDE_AUTHOR);
  const includeReviewerQuery = useSettings(SETTING_KEYS.INCLUDE_REVIEWER);
  const includeApproverQuery = useSettings(SETTING_KEYS.INCLUDE_APPROVER);

  // Fetch user data for reviewer and approver
  const reviewerQuery = useUserLookup(
    policy.reviewedBy,
    includeReviewerQuery.data?.settingValue === true
  );
  const approverQuery = useUserLookup(
    policy.approvedBy,
    includeApproverQuery.data?.settingValue === true
  );

  const formatDate = (dateValue: string | Date | null): string => {
    if (!dateValue) return '';
    
    // If it's already a Date object, use it directly
    if (dateValue instanceof Date) {
      return format(dateValue, 'MMM d, yyyy');
    }
    
    // If it's a string, parse it as an ISO string
    if (typeof dateValue === 'string') {
      return format(new Date(dateValue), 'MMM d, yyyy');
    }
    
    return '';
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return <Badge variant="success">Published</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Helper function to safely get boolean value from settings
  const getBoolean = (value: unknown): boolean => {
    return typeof value === "boolean" ? value : true;
  };

  // Check if settings are still loading
  const settingsLoading = [
    includeDateCreatedQuery,
    includeDateReviewedQuery,
    includeDateApprovedQuery,
    includeAuthorQuery,
    includeReviewerQuery,
    includeApproverQuery,
  ].some((query) => query.isFetching);

  return (
    <header className={`${styles.header} ${className || ''}`}>
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>{policy.title}</h1>
        {getStatusBadge(policy.status)}
      </div>
      
      {!hideMetadata && (
      <div className={styles.metaGrid}>
        {/* Effective Date - always shown */}
        {policy.effectiveDate && (
          <div className={styles.metaItem}>
            <Calendar size={16} className={styles.metaIcon} />
            <span>Effective: {formatDate(policy.effectiveDate)}</span>
          </div>
        )}
        
        {/* Department - always shown */}
        {policy.department && (
          <div className={styles.metaItem}>
            <ShieldCheck size={16} className={styles.metaIcon} />
            <span>Department: {policy.department}</span>
          </div>
        )}
        
        {/* Category - always shown */}
        {policy.category && (
          <div className={styles.metaItem}>
            <Tag size={16} className={styles.metaIcon} />
            <span>Category: {policy.category}</span>
          </div>
        )}

        {/* Date Created - conditional */}
        {!settingsLoading && 
         getBoolean(includeDateCreatedQuery.data?.settingValue) && 
         policy.createdAt && (
          <div className={styles.metaItem}>
            <Calendar size={16} className={styles.metaIcon} />
            <span>Created: {formatDate(policy.createdAt)}</span>
          </div>
        )}

        {/* Date Reviewed - conditional */}
        {!settingsLoading && 
         getBoolean(includeDateReviewedQuery.data?.settingValue) && 
         policy.reviewedAt && (
          <div className={styles.metaItem}>
            <Calendar size={16} className={styles.metaIcon} />
            <span>Reviewed: {formatDate(policy.reviewedAt)}</span>
          </div>
        )}

        {/* Date Approved - conditional */}
        {!settingsLoading && 
         getBoolean(includeDateApprovedQuery.data?.settingValue) && 
         policy.approvedAt && (
          <div className={styles.metaItem}>
            <Calendar size={16} className={styles.metaIcon} />
            <span>Approved: {formatDate(policy.approvedAt)}</span>
          </div>
        )}
      </div>
      )}

      {/* User Information Section */}
      {!hideAuthor && (
      <div className={styles.userInfoGrid}>
        {/* Author - conditional */}
        {!settingsLoading && 
         getBoolean(includeAuthorQuery.data?.settingValue) && (
          <div className={styles.authorInfo}>
            <UserAvatar user={policy.author} className={styles.avatar} />
            <div>
              <span className={styles.authorName}>{policy.author.displayName}</span>
              <span className={styles.authorLabel}>Author</span>
            </div>
          </div>
        )}

        {/* Reviewer - conditional */}
        {!settingsLoading && 
         getBoolean(includeReviewerQuery.data?.settingValue) && 
         policy.reviewedBy && 
         reviewerQuery.data && (
          <div className={styles.authorInfo}>
            <UserAvatar user={reviewerQuery.data} className={styles.avatar} />
            <div>
              <span className={styles.authorName}>{reviewerQuery.data.displayName}</span>
              <span className={styles.authorLabel}>Reviewer</span>
            </div>
          </div>
        )}

        {/* Approver - conditional */}
        {!settingsLoading && 
         getBoolean(includeApproverQuery.data?.settingValue) && 
         policy.approvedBy && 
         approverQuery.data && (
          <div className={styles.authorInfo}>
            <UserAvatar user={approverQuery.data} className={styles.avatar} />
            <div>
              <span className={styles.authorName}>{approverQuery.data.displayName}</span>
              <span className={styles.authorLabel}>Approver</span>
            </div>
          </div>
        )}
      </div>
      )}
    </header>
  );
};