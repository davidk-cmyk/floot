import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '../helpers/useOrganization';
import { useOrgFromUrl } from '../helpers/useOrgFromUrl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Skeleton } from './Skeleton';
import styles from './OrganizationSwitcher.module.css';
import { Building } from 'lucide-react';

export const OrganizationSwitcher = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const { organizationId: currentOrgIdFromUrl } = useOrgFromUrl();
  const { organizationState, switchOrganization } = useOrganization();

  if (organizationState.type === 'loading') {
    return <Skeleton style={{ height: '2.5rem', width: '100%' }} />;
  }

  if (organizationState.type === 'no-organization' && organizationState.availableOrganizations.length === 0) {
    return (
      <div className={styles.noOrgs}>
        No organizations available.
      </div>
    );
  }

  const currentOrgId = organizationState.type === 'active' ? organizationState.currentOrganization.id : undefined;

  const handleSwitchOrganization = (value: string) => {
    if (value) {
      const newOrgId = Number(value);
      switchOrganization(newOrgId);
      // Navigate to new org's dashboard
      navigate(`/${newOrgId}/admin/dashboard`);
    }
  };

  return (
    <Select
      value={currentOrgId ? String(currentOrgId) : undefined}
      onValueChange={handleSwitchOrganization}
    >
      <SelectTrigger className={`${styles.trigger} ${className || ''}`}>
        <div className={styles.triggerContent}>
          <Building size={16} className={styles.icon} />
          <SelectValue placeholder="Select an organization..." />
        </div>
      </SelectTrigger>
      <SelectContent>
        {organizationState.availableOrganizations.map((org) => (
          <SelectItem key={org.id} value={String(org.id)}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};