import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './Dialog';
import { PerPortalEmbedSection } from './PerPortalEmbedSection';
import { useOrganization } from '../helpers/useOrganization';
import { Selectable } from 'kysely';
import { Portals } from '../helpers/schema';
import styles from './PortalEmbedDialog.module.css';

type PortalEmbedDialogProps = {
  portal: Selectable<Portals>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customDomain?: string;
};

export const PortalEmbedDialog: React.FC<PortalEmbedDialogProps> = ({
  portal,
  isOpen,
  onOpenChange,
  customDomain,
}) => {
  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle>Embed Portal: {portal.name}</DialogTitle>
        </DialogHeader>
        <div className={styles.content}>
          {organizationId && (
            <PerPortalEmbedSection
              portalSlug={portal.slug}
              portalName={portal.name}
              organizationId={organizationId}
              customDomain={customDomain}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};