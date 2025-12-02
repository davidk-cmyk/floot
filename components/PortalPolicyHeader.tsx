import React from 'react';
import { format } from 'date-fns';
import { PolicyWithAuthor } from '../endpoints/policies/get_POST.schema';
import { Badge } from './Badge';
import { User, Clock } from 'lucide-react';
import styles from './PortalPolicyHeader.module.css';

interface PortalPolicyHeaderProps {
  policy: PolicyWithAuthor;
  className?: string;
}

export const PortalPolicyHeader: React.FC<PortalPolicyHeaderProps> = ({ policy, className }) => {
  const formatDate = (dateValue: string | Date | null): string => {
    if (!dateValue) return '';
    
    if (dateValue instanceof Date) {
      return format(dateValue, 'MMM d, yyyy');
    }
    
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

  return (
    <header className={`${styles.header} ${className || ''}`}>
      <div className={styles.badgesRow}>
        {policy.category && (
          <Badge className={styles.categoryBadge}>{policy.category}</Badge>
        )}
        {getStatusBadge(policy.status)}
      </div>
      
      <h1 className={styles.title}>{policy.title}</h1>
      
      <div className={styles.metaRow}>
        <div className={styles.metaItem}>
          <User size={16} className={styles.metaIcon} />
          <span>Owned by {policy.author.displayName}</span>
        </div>
        
        {policy.updatedAt && (
          <div className={styles.metaItem}>
            <Clock size={16} className={styles.metaIcon} />
            <span>Updated {formatDate(policy.updatedAt)}</span>
            <span className={styles.version}>v{policy.currentVersion || 1}.0</span>
          </div>
        )}
      </div>
    </header>
  );
};