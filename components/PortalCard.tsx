import React, { useState } from 'react';
import { Selectable } from 'kysely';
import { Portals } from '../helpers/schema';
import { Button } from './Button';
import { Switch } from './Switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from './Dialog';
import { PortalForm } from './PortalForm';
import { PortalPolicyAssignment } from './PortalPolicyAssignment';
import { PortalEmbedDialog } from './PortalEmbedDialog';
import { useUpdatePortal, useDeletePortal } from '../helpers/usePortalApi';
import { useOrganization } from '../helpers/useOrganization';
import { Edit, Trash2, Settings, Code, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PortalStatusIndicator } from './PortalStatusIndicator';
import styles from './PortalCard.module.css';

type PortalCardProps = {
  portal: Selectable<Portals> & { 
    assignedPolicyCount: number;
    publishedPolicyCount: number;
    policyCount: number; // Backward compatibility
  };
  className?: string;
};

export const PortalCard: React.FC<PortalCardProps> = ({ portal, className }) => {
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isEmbedDialogOpen, setEmbedDialogOpen] = useState(false);

  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;

  const updatePortalMutation = useUpdatePortal();
  const deletePortalMutation = useDeletePortal();

  const handleStatusToggle = (isActive: boolean) => {
    updatePortalMutation.mutate({ portalId: portal.id, isActive });
  };

  const handleDelete = () => {
    deletePortalMutation.mutate({ portalId: portal.id }, {
      onSuccess: () => setDeleteConfirmOpen(false),
    });
  };

  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.cardHeader}>
        <h3 className={styles.portalName}>
          {portal.name}
          {portal.slug === 'internal' && <span className={styles.privateLabel}>(Private)</span>}
        </h3>
        <div className={styles.statusToggle}>
          <Switch
            id={`status-${portal.id}`}
            checked={portal.isActive}
            onCheckedChange={handleStatusToggle}
            disabled={updatePortalMutation.isPending}
          />
        </div>
      </div>
      <p className={styles.description}>
        {portal.slug === 'public' 
          ? 'Share policies with external stakeholders, customers, and partners. Perfect for public-facing compliance documentation, terms of service, and privacy policies.'
          : portal.slug === 'internal'
          ? 'Share policies with employees and internal team members only. Use this for internal procedures, HR policies, and confidential operational guidelines.'
          : portal.description || 'No description provided.'}
      </p>
      
      <div className={styles.cardInfo}>
                <PortalStatusIndicator portal={portal} />
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.actionsGrid}>
          <Dialog open={isAssignModalOpen} onOpenChange={setAssignModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className={styles.actionButton}>
                <Settings size={14} /> Manage Policies
              </Button>
            </DialogTrigger>
            <DialogContent className={styles.dialogContent}>
              <DialogHeader>
                <DialogTitle>Manage Policies for {portal.name}</DialogTitle>
              </DialogHeader>
              <PortalPolicyAssignment portalId={portal.id} onSuccess={() => setAssignModalOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className={styles.actionButton}>
                <Edit size={14} /> Edit Portal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Portal</DialogTitle>
              </DialogHeader>
              <PortalForm portal={portal} onSuccess={() => setEditModalOpen(false)} />
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            className={styles.actionButton}
            onClick={() => setEmbedDialogOpen(true)}
            title="Get embed code for this portal"
          >
            <Code size={14} /> Get Embed Code
          </Button>

          {organizationId && (
            <Button variant="outline" size="sm" className={styles.actionButton} asChild>
              <Link to={`/${organizationId}/${portal.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} /> View Portal
              </Link>
            </Button>
          )}
        </div>

        <div className={styles.deleteRow}>
          <Dialog open={isDeleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" className={styles.deleteButton} title="Delete portal">
                <Trash2 size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to delete the "{portal.name}" portal? This action cannot be undone.</p>
              <div className={styles.dialogFooter}>
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleDelete} disabled={deletePortalMutation.isPending}>
                  {deletePortalMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <PortalEmbedDialog
          portal={portal}
          isOpen={isEmbedDialogOpen}
          onOpenChange={setEmbedDialogOpen}
        />
      </div>
    </div>
  );
};