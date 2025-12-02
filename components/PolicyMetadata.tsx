import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Shield, Tag, Building } from 'lucide-react';
import { PolicyWithAuthor } from '../endpoints/policies/get_POST.schema';
import styles from './PolicyMetadata.module.css';

type MetadataField = 'department' | 'category' | 'tags' | 'effectiveDate';

interface PolicyMetadataProps {
  policy: PolicyWithAuthor;
  className?: string;
  hideFields?: MetadataField[];
}

const MetadataItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className={styles.item}>
    <div className={styles.itemHeader}>
      {icon}
      <span className={styles.label}>{label}</span>
    </div>
    <div className={styles.value}>{value}</div>
  </div>
);

export const PolicyMetadata: React.FC<PolicyMetadataProps> = ({ policy, className, hideFields = [] }) => {
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return format(date, 'MMMM d, yyyy');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const shouldShowField = (field: MetadataField) => !hideFields.includes(field);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {policy.effectiveDate && shouldShowField('effectiveDate') && (
        <MetadataItem
          icon={<Calendar size={16} />}
          label="Effective Date"
          value={formatDate(policy.effectiveDate)}
        />
      )}
      {policy.department && shouldShowField('department') && (
        <MetadataItem
          icon={<Building size={16} />}
          label="Department"
          value={policy.department}
        />
      )}
      {policy.category && shouldShowField('category') && (
        <MetadataItem
          icon={<Shield size={16} />}
          label="Category"
          value={policy.category}
        />
      )}
      {policy.tags && policy.tags.length > 0 && shouldShowField('tags') && (
        <MetadataItem
          icon={<Tag size={16} />}
          label="Tags"
          value={
            <div className={styles.tagsContainer}>
              {policy.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          }
        />
      )}
    </div>
  );
};