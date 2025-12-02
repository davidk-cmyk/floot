import React from 'react';
import { PolicyVersionBadge } from './PolicyVersionBadge';
import { AutosaveIndicator } from './AutosaveIndicator';
import { Button } from './Button';
import styles from './PolicyFormShell.module.css';

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface PolicyFormShellProps {
  mode: 'create' | 'edit';
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  headerContent?: React.ReactNode;
  headerActions?: React.ReactNode;
  autosaveStatus: AutosaveStatus;
  lastSaved?: Date;
  hasUnsavedChanges: boolean;
  onManualSave: () => void | Promise<void>;
  isSaving: boolean;
  versionNumber?: number | null;
  className?: string;
}

export const PolicyFormShell: React.FC<PolicyFormShellProps> = ({
  mode,
  children,
  footerContent,
  headerContent,
  headerActions,
  autosaveStatus,
  lastSaved,
  hasUnsavedChanges,
  onManualSave,
  isSaving,
  versionNumber,
  className,
}) => {
  const title = mode === 'create' ? 'Create New Policy' : 'Update Policy';

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {headerContent && (
        <div className={styles.header}>
          {headerContent}
        </div>
      )}
      <div className={styles.content}>
        {children}
      </div>

      {footerContent && (
        <div className={styles.footer}>
          {footerContent}
        </div>
      )}
    </div>
  );
};