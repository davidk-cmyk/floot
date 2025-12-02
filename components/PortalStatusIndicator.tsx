import React from 'react';
import { Selectable } from 'kysely';
import { Globe, Lock, Shield, Users, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Portals } from '../helpers/schema';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';
import { Badge } from './Badge';
import styles from './PortalStatusIndicator.module.css';

type PortalStatusIndicatorProps = {
  portal: Selectable<Portals> & {
    assignedPolicyCount: number;
    publishedPolicyCount: number;
  };
  className?: string;
};

type PortalHealth = 'good' | 'warning' | 'info';

const accessTypeDetails = {
  public: { icon: Globe, label: 'Public' },
  password: { icon: Lock, label: 'Password Protected' },
  authenticated: { icon: Shield, label: 'Authenticated Users' },
  role_based: { icon: Users, label: 'Role-Based' },
};

export const PortalStatusIndicator: React.FC<PortalStatusIndicatorProps> = ({ portal, className }) => {
  const getPortalHealth = (): { status: PortalHealth; messages: string[] } => {
    const messages: string[] = [];
    let status: PortalHealth = 'good';

    if (!portal.isActive) {
      status = 'info';
      messages.push('Portal is currently inactive and not accessible.');
    } else {
      messages.push('Portal is active and accessible.');
    }

    if (portal.isActive && portal.assignedPolicyCount === 0) {
      status = 'warning';
      messages.push('Warning: No policies are assigned to this portal.');
    } else if (portal.isActive && portal.publishedPolicyCount === 0) {
      status = 'warning';
      messages.push('Warning: Policies are assigned but none are published yet.');
    } else if (portal.assignedPolicyCount > portal.publishedPolicyCount) {
            if (status === 'good') status = 'info';
      messages.push(`${portal.assignedPolicyCount - portal.publishedPolicyCount} assigned policies are not yet published.`);
    }

    if (status === 'good') {
      messages.push('All assigned policies are published.');
    }

    return { status, messages };
  };

  const { status, messages } = getPortalHealth();
  const AccessIcon = accessTypeDetails[portal.accessType as keyof typeof accessTypeDetails]?.icon || Globe;
  const accessLabel = accessTypeDetails[portal.accessType as keyof typeof accessTypeDetails]?.label || 'Public';

  const HealthIcon = {
    good: <CheckCircle className={`${styles.healthIcon} ${styles.good}`} size={16} />,
    warning: <AlertTriangle className={`${styles.healthIcon} ${styles.warning}`} size={16} />,
    info: <Info className={`${styles.healthIcon} ${styles.info}`} size={16} />,
  }[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`${styles.indicatorContainer} ${className || ''}`}>
          {HealthIcon}
          <Badge variant={portal.isActive ? 'success' : 'secondary'}>
            {portal.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <div className={styles.iconWrapper}>
            <AccessIcon size={16} />
          </div>
          <div className={styles.policyStatus}>
            <strong>{portal.publishedPolicyCount}</strong>
            <span className={styles.separator}>/</span>
            <span>{portal.assignedPolicyCount}</span>
            <span className={styles.policyLabel}>Published</span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className={styles.tooltipContent}>
        <div className={styles.tooltipHeader}>
          {HealthIcon}
          <h4 className={styles.tooltipTitle}>Portal Status</h4>
        </div>
        <ul className={styles.tooltipList}>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
        <div className={styles.tooltipDivider} />
        <div className={styles.tooltipDetail}>
          <strong>Access Type:</strong> {accessLabel}
        </div>
        <div className={styles.tooltipDetail}>
          <strong>Policies:</strong> {portal.publishedPolicyCount} published out of {portal.assignedPolicyCount} assigned.
        </div>
      </TooltipContent>
    </Tooltip>
  );
};