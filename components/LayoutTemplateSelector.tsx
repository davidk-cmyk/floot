import React from 'react';
import { useLayoutTemplates } from '../helpers/useLayoutTemplates';
import { useOrganizationVariables } from '../helpers/useOrganizationVariables';
import { useOrganization } from '../helpers/useOrganization';
import { useSettings } from '../helpers/useSettingsApi';
import { Skeleton } from './Skeleton';
import { CheckCircle2 } from 'lucide-react';
import styles from './LayoutTemplateSelector.module.css';
import { processTemplateContent, OrganizationVariables, validateOrganizationVariables } from '../helpers/templateProcessor';
import { Selectable } from 'kysely';
import { LayoutTemplates } from '../helpers/schema';

interface LayoutTemplateSelectorProps {
  value: number | null | undefined;
  onChange: (id: number) => void;
  className?: string;
}

const TemplatePreview = ({
  template,
}: {
  template: Selectable<LayoutTemplates>;
}) => {
  const { data: variables, isLoading } = useOrganizationVariables();
  const { organizationState } = useOrganization();
  const { data: settingsData } = useSettings('organization_variables', 
    organizationState.type === 'active'
  );

  const sampleVariables: OrganizationVariables = {
    company: { name: 'MyPolicyPortal Inc.', address: '123 Policy Lane' },
    leadership: { ceo: 'Jane Doe' },
    contact: { supportPhone: '555-1234' },
  };

  const settingsVariables: OrganizationVariables = settingsData?.settingValue 
    ? validateOrganizationVariables(settingsData.settingValue)
    : {};

  const propVariables: OrganizationVariables = variables
    ? variables.reduce(
        (acc, v) => {
          const [category, key] = v.variableName.split('.');
          if (category && key) {
            if (!acc[category]) {
              acc[category] = {};
            }
            acc[category][key] = v.variableValue;
          }
          return acc;
        },
        {} as OrganizationVariables,
      )
    : {};

  const effectiveVariables: OrganizationVariables = Object.keys(settingsVariables).length > 0 
    ? settingsVariables 
    : Object.keys(propVariables).length > 0 
    ? propVariables 
    : sampleVariables;

  const organization = organizationState.type === 'active' ? organizationState.currentOrganization : undefined;

  if (isLoading) {
    return <Skeleton style={{ height: '120px' }} />;
  }

  return (
    <div className={styles.previewContent}>
      <header
        dangerouslySetInnerHTML={{
          __html: processTemplateContent(
            template.headerTemplate || '<div>Header</div>',
            organization,
            effectiveVariables,
          ),
        }}
      />
      <main>
        <p>
          This is a preview of the <strong>{template.name}</strong> template. It
          shows how the header and footer will look with your organization's
          variables.
        </p>
      </main>
      <footer
        dangerouslySetInnerHTML={{
          __html: processTemplateContent(
            template.footerTemplate || '<div>Footer</div>',
            organization,
            effectiveVariables,
          ),
        }}
      />
    </div>
  );
};

export const LayoutTemplateSelector = ({
  value,
  onChange,
  className,
}: LayoutTemplateSelectorProps) => {
  const { data: templates, isLoading, error } = useLayoutTemplates();

  if (isLoading) {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className={styles.templateCardSkeleton} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        Error loading templates: {error.message}
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {templates?.map((template) => (
        <div
          key={template.id}
          className={`${styles.templateCard} ${value === template.id ? styles.selected : ''}`}
          onClick={() => onChange(template.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onChange(template.id);
            }
          }}
          tabIndex={0}
          role="radio"
          aria-checked={value === template.id}
        >
          <div className={styles.cardHeader}>
            <h3 className={styles.templateName}>{template.name}</h3>
            {value === template.id && (
              <CheckCircle2 size={20} className={styles.checkIcon} />
            )}
          </div>
          <div className={styles.previewWrapper}>
            <TemplatePreview template={template} />
          </div>
        </div>
      ))}
    </div>
  );
};