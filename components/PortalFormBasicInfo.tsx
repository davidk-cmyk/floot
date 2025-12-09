import React from 'react';
import { FormItem, FormLabel, FormControl, FormMessage, FormDescription } from './Form';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Info } from 'lucide-react';
import { PortalFormData } from '../helpers/portalFormValidation';
import styles from './PortalFormBasicInfo.module.css';

type PortalFormBasicInfoProps = {
  values: PortalFormData;
  setValues: (updater: (prev: PortalFormData) => PortalFormData) => void;
  isEditing: boolean;
  generateSlug: (name: string) => string;
};

export const PortalFormBasicInfo: React.FC<PortalFormBasicInfoProps> = ({
  values,
  setValues,
  isEditing,
  generateSlug,
}) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setValues((prev: PortalFormData) => ({
      ...prev,
      name: newName,
      // Auto-generate slug only if not editing or if slug hasn't been manually modified
      ...((!isEditing || prev.slug === generateSlug(prev.name)) && {
        slug: generateSlug(newName)
      })
    }));
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Info className={styles.sectionIcon} />
        <div>
          <h3 className={styles.sectionTitle}>Basic Information</h3>
          <p className={styles.sectionDescription}>
            Configure the basic details and identification for your portal.
          </p>
        </div>
      </div>

      <div className={styles.sectionContent}>
        <FormItem name="name">
          <FormLabel>Portal Name</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., Public Compliance Portal"
              value={values.name}
              onChange={handleNameChange}
            />
          </FormControl>
          <FormDescription>
            A descriptive name that will be displayed to users accessing this portal.
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem name="slug">
          <FormLabel>URL Slug</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., public-compliance"
              value={values.slug}
              onChange={e => setValues((prev: PortalFormData) => ({ ...prev, slug: e.target.value }))}
            />
          </FormControl>
          <FormDescription>
                        Unique identifier used in the portal URL: <code>{`/{orgId}/${values.slug || 'your-slug'}`}</code>
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem name="label">
          <FormLabel>Portal Label</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., Internal Portal, Public Portal, HR Portal"
              value={values.label ?? ''}
              onChange={e => setValues((prev: PortalFormData) => ({ ...prev, label: e.target.value }))}
            />
          </FormControl>
          <FormDescription>
            A short label displayed as a badge above the portal name (e.g., "Internal Portal").
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem name="description">
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Provide a clear description of this portal's purpose and the policies it contains."
              value={values.description ?? ''}
              onChange={e => setValues((prev: PortalFormData) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </FormControl>
          <FormDescription>
            This description will be shown to users when they access the portal.
          </FormDescription>
          <FormMessage />
        </FormItem>
      </div>
    </div>
  );
};