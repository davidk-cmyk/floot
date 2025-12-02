import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, ExternalLink, Globe } from 'lucide-react';
import { PolicyWithAuthor, CurrentUserStatus, UserAssignmentAndAcknowledgment } from '../endpoints/policies/get_POST.schema';
import { Selectable } from 'kysely';
import { PolicyVersions } from '../helpers/schema';
import { User } from '../helpers/User';
import { PolicyAcknowledgeButton } from './PolicyAcknowledgeButton';
import { useOrgNavigation } from '../helpers/useOrgNavigation';
import { PolicyVersionHistory } from './PolicyVersionHistory';
import { PolicyStatusActions } from './PolicyStatusActions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion';
import { Button } from './Button';
import styles from './PolicySidebar.module.css';

interface PolicySidebarProps {
  policy: PolicyWithAuthor;
  currentUserStatus: CurrentUserStatus;
  adminView: UserAssignmentAndAcknowledgment[] | null;
  versions: Selectable<PolicyVersions>[];
  user: User | null;
  className?: string;
}

export const PolicySidebar: React.FC<PolicySidebarProps> = ({
  policy,
  currentUserStatus,
  adminView,
  versions,
  user,
  className,
}) => {
  const { buildUrl } = useOrgNavigation();
  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  return (
    <aside className={`${styles.sidebar} ${className || ''}`}>
      {canEdit && (
        <div className={styles.editSection}>
          <Button asChild size="lg" className={styles.editButton}>
            <Link to={buildUrl(`/admin/policies/${policy.id}/edit`)}>
              <Edit />
              Edit Policy
            </Link>
          </Button>
        </div>
      )}

      <PolicyStatusActions policy={policy} />

      {isAdmin && policy.assignedPortals.length > 0 && (
        <div className={styles.portalSection}>
          <div className={styles.portalHeader}>
            <Globe className={styles.portalIcon} />
            <span className={styles.portalTitle}>View on Portals</span>
          </div>
          <div className={styles.portalButtons}>
            {policy.assignedPortals.map((portal) => (
              <Button
                key={portal.id}
                variant="outline"
                size="sm"
                className={styles.portalButton}
                onClick={() => {
                  // This opens in a new tab, but we still want to respect the org structure if possible.
                  // However, since it's a new tab/window, simply prepending buildUrl might be relative to current domain.
                  // buildUrl returns a relative path like /123/portal/slug/policies/456
                  const portalUrl =     buildUrl(`/${portal.slug}/${policy.id}`);
                  window.open(portalUrl, '_blank', 'noopener,noreferrer');
                }}
                aria-label={`View this policy on ${portal.name} (opens in new tab)`}
              >
                <ExternalLink />
                {portal.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Accordion type="multiple" defaultValue={['item-1']} className={styles.accordion}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Version History</AccordionTrigger>
          <AccordionContent>
            <div className={styles.card}>
              <PolicyVersionHistory policyId={policy.id} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
};