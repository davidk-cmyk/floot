import React, { useEffect } from 'react';
import { useForm, Form } from './Form';
import { Button } from './Button';
import { useCreatePortal, useUpdatePortal } from '../helpers/usePortalApi';
import { Selectable } from 'kysely';
import { Portals } from '../helpers/schema';
import { portalFormSchema, PortalFormData } from '../helpers/portalFormValidation';
import { PortalFormBasicInfo } from './PortalFormBasicInfo';
import { PortalFormAccessControl } from './PortalFormAccessControl';
import { PortalFormBehaviorSettings } from './PortalFormBehaviorSettings';
import styles from './PortalForm.module.css';

type PortalFormProps = {
  portal?: Selectable<Portals> & { emailRecipients?: string[] };
  onSuccess?: () => void;
  className?: string;
};

export const PortalForm: React.FC<PortalFormProps> = ({ portal, onSuccess, className }) => {
  const createPortalMutation = useCreatePortal();
  const updatePortalMutation = useUpdatePortal();
  const isEditing = !!portal;

  const form = useForm({
    schema: portalFormSchema,
    defaultValues: {
      name: portal?.name ?? '',
      slug: portal?.slug ?? '',
      label: portal?.label ?? '',
      description: portal?.description ?? '',
      accessType: (portal?.accessType as 'public' | 'password' | 'authenticated' | 'role_based') ?? 'public',
      password: '',
      allowedRoles: portal?.allowedRoles as any ?? [],
      isActive: portal?.isActive ?? true,
      requiresAcknowledgment: portal?.requiresAcknowledgment ?? false,
      acknowledgmentMode: (portal?.acknowledgmentMode as 'simple' | 'confirmed_understanding' | 'email') ?? 'simple',
      minimumReadingTimeSeconds: portal?.minimumReadingTimeSeconds ?? 0,
      requireFullScroll: portal?.requireFullScroll ?? false,
      acknowledgmentDueDays: portal?.acknowledgmentDueDays ?? undefined,
      acknowledgmentReminderDays: portal?.acknowledgmentReminderDays ?? undefined,
      emailRecipients: portal?.emailRecipients ?? [],
    },
  });

  const { values, setValues, handleSubmit } = form;

  useEffect(() => {
    if (portal) {
      setValues({
        name: portal.name,
        slug: portal.slug,
        label: portal.label ?? '',
        description: portal.description ?? '',
        accessType: portal.accessType as 'public' | 'password' | 'authenticated' | 'role_based',
        password: '',
        allowedRoles: (portal.allowedRoles as any) ?? [],
        isActive: portal.isActive,
        requiresAcknowledgment: portal.requiresAcknowledgment ?? false,
        acknowledgmentMode: (portal.acknowledgmentMode as 'simple' | 'confirmed_understanding' | 'email') ?? 'simple',
        minimumReadingTimeSeconds: portal.minimumReadingTimeSeconds ?? 0,
        requireFullScroll: portal.requireFullScroll ?? false,
        acknowledgmentDueDays: portal.acknowledgmentDueDays ?? undefined,
        acknowledgmentReminderDays: portal.acknowledgmentReminderDays ?? undefined,
        emailRecipients: portal.emailRecipients ?? [],
      });
    }
  }, [portal, setValues]);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const onSubmit = (data: PortalFormData) => {
    if (isEditing && portal) {
      const updateData: any = { portalId: portal.id };
      if (data.name !== portal.name) updateData.name = data.name;
      if (data.slug !== portal.slug) updateData.slug = data.slug;
      if (data.label !== portal.label) updateData.label = data.label;
      if (data.description !== portal.description) updateData.description = data.description;
      if (data.accessType !== portal.accessType) updateData.accessType = data.accessType;
      if (data.password) updateData.password = data.password;
      if (JSON.stringify(data.allowedRoles) !== JSON.stringify(portal.allowedRoles)) updateData.allowedRoles = data.allowedRoles;
      if (data.isActive !== portal.isActive) updateData.isActive = data.isActive;
      if (data.requiresAcknowledgment !== (portal.requiresAcknowledgment ?? false)) updateData.requiresAcknowledgment = data.requiresAcknowledgment;
      if (data.acknowledgmentMode !== portal.acknowledgmentMode) updateData.acknowledgmentMode = data.acknowledgmentMode;
      if (data.minimumReadingTimeSeconds !== portal.minimumReadingTimeSeconds) updateData.minimumReadingTimeSeconds = data.minimumReadingTimeSeconds;
      if (data.requireFullScroll !== portal.requireFullScroll) updateData.requireFullScroll = data.requireFullScroll;
      if (data.acknowledgmentDueDays !== portal.acknowledgmentDueDays) updateData.acknowledgmentDueDays = data.acknowledgmentDueDays ?? null;
      if (data.acknowledgmentReminderDays !== portal.acknowledgmentReminderDays) updateData.acknowledgmentReminderDays = data.acknowledgmentReminderDays ?? null;
      if (JSON.stringify(data.emailRecipients) !== JSON.stringify(portal.emailRecipients)) updateData.emailRecipients = data.emailRecipients;
      
      updatePortalMutation.mutate(updateData, { onSuccess });
    } else {
      createPortalMutation.mutate(data, { onSuccess });
    }
  };

  const isMutating = createPortalMutation.isPending || updatePortalMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className={`${styles.form} ${className || ''}`}>
        <PortalFormBasicInfo
          values={values}
          setValues={setValues}
          isEditing={isEditing}
          generateSlug={generateSlug}
        />

        <PortalFormAccessControl
          values={values}
          setValues={setValues}
          isEditing={isEditing}
        />

        <PortalFormBehaviorSettings
          values={values}
          setValues={setValues}
        />

        <div className={styles.footer}>
          <Button type="submit" disabled={isMutating}>
            {isMutating ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Portal'}
          </Button>
        </div>
      </form>
    </Form>
  );
};