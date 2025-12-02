import React from 'react';
import { useSettingsMany, useUpdateSettings } from '../helpers/useSettingsApi';
import { useAuth } from '../helpers/useAuth';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import styles from './PolicySettingsMigrator.module.css';

const POLICY_SETTINGS_KEYS = [
  'policy.categories',
  'policy.departments',
  'policy.tags',
];

const DEFAULT_SETTINGS = {
  'policy.categories': [
    { id: 'hr', name: 'Human Resources' },
    { id: 'it', name: 'Information Technology' },
    { id: 'finance', name: 'Finance' },
    { id: 'legal', name: 'Legal & Compliance' },
    { id: 'operations', name: 'Operations' },
  ],
  'policy.departments': [
    { id: 'engineering', name: 'Engineering' },
    { id: 'product', name: 'Product' },
    { id: 'design', name: 'Design' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'sales', name: 'Sales' },
    { id: 'support', name: 'Customer Support' },
  ],
  'policy.tags': [
    { id: 'security', name: 'Security' },
    { id: 'privacy', name: 'Privacy' },
    { id: 'internal', name: 'Internal' },
    { id: 'public', name: 'Public Facing' },
  ],
};

type SettingValue = { id: string; name: string }[];

const getSettingCount = (value: unknown): number => {
  if (Array.isArray(value)) {
    return value.length;
  }
  return 0;
};

export const PolicySettingsMigrator = ({ className }: { className?: string }) => {
  const { authState } = useAuth();
  const { data: settings, isFetching } = useSettingsMany(POLICY_SETTINGS_KEYS);
  const { mutate: updateSettings, isPending: isUpdating } = useUpdateSettings();

  if (authState.type !== 'authenticated' || authState.user.role !== 'admin') {
    return null;
  }

  const handleApplyDefaults = () => {
    if (!settings) return;

    POLICY_SETTINGS_KEYS.forEach((key) => {
      const setting = settings[key];
      if (!setting || !setting.settingValue || getSettingCount(setting.settingValue) === 0) {
        updateSettings({
          settingKey: key,
          settingValue: DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS],
        });
      }
    });
  };

  const settingsExist = settings && POLICY_SETTINGS_KEYS.every(key => {
    const setting = settings[key];
    return setting && setting.settingValue && getSettingCount(setting.settingValue) > 0;
  });

  const renderContent = () => {
    if (isFetching) {
      return (
        <>
          <div className={styles.status}>
            <Skeleton style={{ width: '200px', height: '1.5rem' }} />
          </div>
          <div className={styles.counts}>
            <Skeleton style={{ width: '120px', height: '3rem' }} />
            <Skeleton style={{ width: '120px', height: '3rem' }} />
            <Skeleton style={{ width: '120px', height: '3rem' }} />
          </div>
          <div className={styles.actions}>
            <Skeleton style={{ width: '180px', height: '2.5rem' }} />
            <Skeleton style={{ width: '220px', height: '2.5rem' }} />
          </div>
        </>
      );
    }

    return (
      <>
        <div className={styles.status}>
          {settingsExist ? (
            <>
              <CheckCircle className={styles.successIcon} />
              <span>Default policy settings are configured.</span>
            </>
          ) : (
            <>
              <AlertTriangle className={styles.warningIcon} />
              <span>Default policy settings are missing.</span>
            </>
          )}
        </div>
        <div className={styles.counts}>
          <div className={styles.countCard}>
            <span className={styles.countNumber}>
              {getSettingCount(settings?.['policy.categories']?.settingValue)}
            </span>
            <span className={styles.countLabel}>Categories</span>
          </div>
          <div className={styles.countCard}>
            <span className={styles.countNumber}>
              {getSettingCount(settings?.['policy.departments']?.settingValue)}
            </span>
            <span className={styles.countLabel}>Departments</span>
          </div>
          <div className={styles.countCard}>
            <span className={styles.countNumber}>
              {getSettingCount(settings?.['policy.tags']?.settingValue)}
            </span>
            <span className={styles.countLabel}>Tags</span>
          </div>
        </div>
        <div className={styles.actions}>
          {!settingsExist && (
            <Button onClick={handleApplyDefaults} disabled={isUpdating}>
              {isUpdating ? 'Applying...' : 'Apply Default Settings'}
            </Button>
          )}
          <Button variant="secondary" disabled>
            Migrate All Organizations
          </Button>
        </div>
        <div className={styles.info}>
          <Info size={16} />
          <span>
            "Migrate All Organizations" requires a dedicated endpoint and is currently disabled.
          </span>
        </div>
      </>
    );
  };

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <h3 className={styles.title}>Policy Settings Migration</h3>
      {renderContent()}
    </div>
  );
};