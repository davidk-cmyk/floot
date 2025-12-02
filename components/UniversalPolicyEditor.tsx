import React, { useCallback } from 'react';
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from './Form';
import { Input } from './Input';
import { PolicyMetadataSection } from './PolicyMetadataSection';
import { UniversalPolicyFormValues } from '../helpers/universalPolicyFormSchema';
import { WysiwygEditor } from './WysiwygEditor';
import styles from './UniversalPolicyEditor.module.css';

// A simplified interface matching the relevant parts of useForm's return type
interface PolicyForm {
  values: UniversalPolicyFormValues;
  setValues: React.Dispatch<React.SetStateAction<UniversalPolicyFormValues>>;
}

interface UniversalPolicyEditorProps {
  form: PolicyForm;
  mode: 'create' | 'edit';
  policyId?: number;
  titleInputRef: React.RefObject<HTMLInputElement>;
  className?: string;
  assignedPortals?: Array<{
    id: number;
    name: string;
    slug: string;
    requiresAcknowledgment: boolean;
  }>;
}

export const UniversalPolicyEditor: React.FC<UniversalPolicyEditorProps> = ({
  form,
  mode,
  policyId,
  titleInputRef,
  className,
  assignedPortals,
}) => {
  const onStatusChange = useCallback((value: string) => {
    form.setValues((prev) => ({ ...prev, status: value }));
  }, [form.setValues]);

  const onEffectiveDateChange = useCallback((date: Date | null) => {
    form.setValues((prev) => ({ ...prev, effectiveDate: date || undefined }));
  }, [form.setValues]);

  const onExpirationDateChange = useCallback((date: Date | null) => {
    form.setValues((prev) => ({ ...prev, expirationDate: date || undefined }));
  }, [form.setValues]);

  const onReviewDateChange = useCallback((date: Date | null) => {
    form.setValues((prev) => ({ ...prev, reviewDate: date || undefined }));
  }, [form.setValues]);

  const onDepartmentChange = useCallback((value: string) => {
    form.setValues((prev) => ({ ...prev, department: value }));
  }, [form.setValues]);

  const onCategoryChange = useCallback((value: string) => {
    form.setValues((prev) => ({ ...prev, category: value }));
  }, [form.setValues]);

  const onTagsChange = useCallback((tags: string[]) => {
    form.setValues((prev) => ({ ...prev, tags }));
  }, [form.setValues]);

  const onAcknowledgmentModeChange = useCallback((value: string) => {
    form.setValues((prev) => ({ ...prev, acknowledgmentMode: value as 'simple' | 'quiz' }));
  }, [form.setValues]);

  const onVersionNotesChange = useCallback((value: string) => {
    form.setValues((prev) => ({ ...prev, changeSummary: value }));
  }, [form.setValues]);

  const onPortalIdsChange = useCallback((portalIds: number[]) => {
    form.setValues((prev) => ({ ...prev, portalIds }));
  }, [form.setValues]);

  return (
    <div className={`${styles.layout} ${className || ''}`}>
      <div className={styles.mainContent}>
        <FormItem name="title">
          <FormLabel>Title *</FormLabel>
          <FormControl>
            <Input
              ref={titleInputRef}
              value={form.values.title || ''}
              onChange={(e) => form.setValues((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Policy Title"
              aria-required="true"
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="content">
          <FormLabel>Content *</FormLabel>
          <FormControl>
            <WysiwygEditor
              value={form.values.content}
              onChange={(value) => form.setValues((prev) => ({ ...prev, content: value }))}
              placeholder="Policy content..."
              documentVersion={policyId}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </div>

      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>Policy Metadata</h3>
        </div>
        <PolicyMetadataSection
          status={form.values.status || 'draft'}
          onStatusChange={onStatusChange}
          effectiveDate={form.values.effectiveDate}
          onEffectiveDateChange={onEffectiveDateChange}
          expirationDate={form.values.expirationDate}
          onExpirationDateChange={onExpirationDateChange}
          reviewDate={form.values.reviewDate}
          onReviewDateChange={onReviewDateChange}
          department={form.values.department || ''}
          onDepartmentChange={onDepartmentChange}
          category={form.values.category || ''}
          onCategoryChange={onCategoryChange}
          tags={form.values.tags || []}
          onTagsChange={onTagsChange}
          acknowledgmentMode={form.values.acknowledgmentMode}
          onAcknowledgmentModeChange={onAcknowledgmentModeChange}
          versionNotes={form.values.changeSummary || ''}
          onVersionNotesChange={onVersionNotesChange}
          portalIds={form.values.portalIds || []}
          onPortalIdsChange={onPortalIdsChange}
          assignedPortals={assignedPortals}
        />
      </div>
    </div>
  );
};