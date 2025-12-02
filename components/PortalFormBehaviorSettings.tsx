import React, { useEffect } from 'react';
import { FormItem, FormLabel, FormControl, FormMessage, FormDescription } from './Form';
import { Input } from './Input';
import { Switch } from './Switch';
import { Badge } from './Badge';
import { Settings } from 'lucide-react';
import { PortalFormData } from '../helpers/portalFormValidation';
import { RadioGroup, RadioGroupItem } from './RadioGroup';
import { PortalFormEmailRecipients } from './PortalFormEmailRecipients';
import styles from './PortalFormBehaviorSettings.module.css';

type PortalFormBehaviorSettingsProps = {
  values: PortalFormData;
  setValues: (updater: (prev: PortalFormData) => PortalFormData) => void;
};

export const PortalFormBehaviorSettings: React.FC<PortalFormBehaviorSettingsProps> = ({
  values,
  setValues,
}) => {
  const isPasswordProtected = values.accessType === 'password';
  const requiresAcknowledgment = values.requiresAcknowledgment ?? false;
  const showEmailOption = isPasswordProtected && requiresAcknowledgment;

  useEffect(() => {
    if (isPasswordProtected && requiresAcknowledgment && values.acknowledgmentMode !== 'email') {
      setValues((prev: PortalFormData) => ({ ...prev, acknowledgmentMode: 'email' }));
    }
  }, [isPasswordProtected, requiresAcknowledgment, values.acknowledgmentMode, setValues]);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Settings className={styles.sectionIcon} />
        <div>
          <h3 className={styles.sectionTitle}>Behavior Settings</h3>
          <p className={styles.sectionDescription}>
            Configure how users interact with policies in this portal.
          </p>
        </div>
      </div>

      <div className={styles.sectionContent}>
        <FormItem name="requiresAcknowledgment">
          <div className={styles.switchContainer}>
            <div className={styles.switchLabelContainer}>
              <FormLabel>Requires Policy Acknowledgment</FormLabel>
              <FormDescription>
                When enabled, users must formally acknowledge that they have read and understood each policy. 
                This creates an audit trail and ensures compliance with your organization's requirements.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={requiresAcknowledgment}
                onCheckedChange={checked => setValues((prev: PortalFormData) => ({ ...prev, requiresAcknowledgment: checked }))}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>

        {requiresAcknowledgment && (
          <>
            <FormItem name="acknowledgmentMode">
              <FormLabel>Acknowledgment Mode</FormLabel>
              <RadioGroup
                value={values.acknowledgmentMode ?? 'simple'}
                onValueChange={value => setValues((prev: PortalFormData) => ({ 
                  ...prev, 
                  acknowledgmentMode: value as 'simple' | 'confirmed_understanding' | 'email'
                }))}
              >
                <div className={`${styles.radioOption} ${styles.radioOptionDisabled}`}>
                  <FormControl>
                    <RadioGroupItem value="simple" id="mode-simple" disabled />
                  </FormControl>
                  <label htmlFor="mode-simple" className={styles.radioLabel}>
                    <div className={styles.radioLabelHeader}>
                      <span className={styles.radioLabelTitle}>Simple Acknowledgment</span>
                      <Badge variant="secondary" className={styles.comingSoonBadge}>Coming Soon</Badge>
                    </div>
                    <span className={styles.radioLabelDescription}>
                      User just clicks acknowledge to confirm they've read the policy
                    </span>
                  </label>
                </div>
                <div className={`${styles.radioOption} ${styles.radioOptionDisabled}`}>
                  <FormControl>
                    <RadioGroupItem value="confirmed_understanding" id="mode-confirmed" disabled />
                  </FormControl>
                  <label htmlFor="mode-confirmed" className={styles.radioLabel}>
                    <div className={styles.radioLabelHeader}>
                      <span className={styles.radioLabelTitle}>Confirmed Understanding</span>
                      <Badge variant="secondary" className={styles.comingSoonBadge}>Coming Soon</Badge>
                    </div>
                    <span className={styles.radioLabelDescription}>
                      User must confirm key points or pass a quiz to demonstrate understanding
                    </span>
                  </label>
                </div>
                {showEmailOption && (
                  <div className={styles.radioOption}>
                    <FormControl>
                      <RadioGroupItem value="email" id="mode-email" />
                    </FormControl>
                    <label htmlFor="mode-email" className={styles.radioLabel}>
                      <span className={styles.radioLabelTitle}>Email Verification</span>
                      <span className={styles.radioLabelDescription}>
                        Anonymous visitors verify with email code before acknowledging
                      </span>
                    </label>
                  </div>
                )}
              </RadioGroup>
              <FormMessage />
            </FormItem>

            <FormItem name="minimumReadingTimeSeconds">
              <FormLabel>Minimum Reading Time (seconds)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g., 60"
                  value={values.minimumReadingTimeSeconds ?? 0}
                  onChange={e => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setValues((prev: PortalFormData) => ({ ...prev, minimumReadingTimeSeconds: val }));
                  }}
                />
              </FormControl>
              <FormDescription>
                Minimum time users must spend reading policies before they can acknowledge. Set to 0 for no requirement.
              </FormDescription>
              <FormMessage />
            </FormItem>

            <FormItem name="requireFullScroll">
              <div className={styles.switchContainer}>
                <div className={styles.switchLabelContainer}>
                  <FormLabel>Require Full Scroll Completion</FormLabel>
                  <FormDescription>
                    Users must scroll to the bottom of the policy before they can acknowledge it. 
                    This ensures users have at least viewed the entire policy content.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={values.requireFullScroll ?? false}
                    onCheckedChange={checked => setValues((prev: PortalFormData) => ({ ...prev, requireFullScroll: checked }))}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>

            <FormItem name="acknowledgmentDueDays">
              <FormLabel>Days to Acknowledge</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g., 30"
                  value={values.acknowledgmentDueDays ?? ''}
                  onChange={e => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                    setValues((prev: PortalFormData) => ({ ...prev, acknowledgmentDueDays: val }));
                  }}
                />
              </FormControl>
              <FormDescription>
                Number of days after a policy is published or added to this portal within which users must acknowledge it. Leave empty for no deadline.
              </FormDescription>
              <FormMessage />
            </FormItem>

            {values.acknowledgmentDueDays && (
              <FormItem name="acknowledgmentReminderDays">
                <FormLabel>Reminder Days Before Due</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 7"
                    value={values.acknowledgmentReminderDays ?? ''}
                    onChange={e => {
                      const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                      setValues((prev: PortalFormData) => ({ ...prev, acknowledgmentReminderDays: val }));
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Number of days before the due date to send reminder notifications. Leave empty for no reminders.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}

            {values.acknowledgmentMode === 'email' && (
              <PortalFormEmailRecipients
                emailRecipients={values.emailRecipients ?? []}
                onChange={(emails) => setValues((prev: PortalFormData) => ({ ...prev, emailRecipients: emails }))}
              />
            )}
          </>
        )}

        <FormItem name="isActive">
          <div className={styles.switchContainer}>
            <div className={styles.switchLabelContainer}>
              <FormLabel>Portal Status</FormLabel>
              <FormDescription>
                Inactive portals are not accessible to users and will show a "not available" message. 
                Use this to temporarily disable access without deleting the portal.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={values.isActive ?? true}
                onCheckedChange={checked => setValues((prev: PortalFormData) => ({ ...prev, isActive: checked }))}
              />
            </FormControl>
          </div>
          <div className={styles.statusIndicator}>
            <span className={`${styles.statusDot} ${values.isActive ? styles.active : styles.inactive}`} />
            <span className={styles.statusText}>
              {values.isActive ? 'Active - Portal is accessible' : 'Inactive - Portal is disabled'}
            </span>
          </div>
          <FormMessage />
        </FormItem>
      </div>
    </div>
  );
};