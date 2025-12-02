import React from 'react';
import { Globe, Lock, FileText, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Selectable } from 'kysely';
import { Portals } from '../helpers/schema';
import { useOrganization } from '../helpers/useOrganization';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';
import styles from './PortalQuickAccessItem.module.css';

type Portal = Selectable<Portals> & { policyCount: number };

interface PortalQuickAccessItemProps {
  portal: Portal;
}

const getStatusIcon = (accessType: string) => {
  switch (accessType) {
    case 'public':
      return <Globe size={16} className={styles.statusIcon} />;
    case 'password':
      return <Lock size={16} className={styles.statusIcon} />;
    default:
      return <FileText size={16} className={styles.statusIcon} />;
  }
};

export const PortalQuickAccessItem: React.FC<PortalQuickAccessItemProps> = ({ portal }) => {
    const { organizationState } = useOrganization();

  const handleCopyPortalLink = async () => {
    try {
      const orgId = organizationState.type === 'active' ? organizationState.currentOrganization.id : '';
      const portalUrl = `${window.location.origin}/${orgId}/${portal.slug}`;
      await navigator.clipboard.writeText(portalUrl);
      toast.success('Portal link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy portal link:', error);
      toast.error('Failed to copy portal link');
    }
  };

  return (
    <div className={styles.itemRow}>
      {getStatusIcon(portal.accessType)}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={styles.nameContainer}>
            <span className={styles.portalName}>{portal.name}</span>
            <span className={styles.policyCount}>({portal.policyCount})</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {portal.name}
        </TooltipContent>
      </Tooltip>
      <div className={styles.actions}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleCopyPortalLink}
              className={styles.actionIcon}
              type="button"
            >
              <Copy size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Copy portal link
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};