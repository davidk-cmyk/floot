import React, { useState, useMemo } from 'react';
import { Selectable } from 'kysely';
import { LayoutTemplates, OrganizationVariables as OrgVariable } from '../helpers/schema';
import { Button } from './Button';
import { Smartphone, Tablet, Monitor } from 'lucide-react';
import { processTemplateContent, OrganizationVariables, validateOrganizationVariables } from '../helpers/templateProcessor';
import { useOrganization } from '../helpers/useOrganization';
import { useSettings } from '../helpers/useSettingsApi';
import styles from './DocumentPreview.module.css';

type PreviewMode = 'desktop' | 'tablet' | 'mobile';

interface DocumentPreviewProps {
  template: Selectable<LayoutTemplates> | null | undefined;
  variables: Selectable<OrgVariable>[];
  className?: string;
}

const samplePolicy = {
  title: 'Sample Policy: Code of Conduct',
  content: `
    <h2>1. Introduction</h2>
    <p>This Code of Conduct applies to all employees of /company.name/.</p>
    <h2>2. Professionalism</h2>
    <p>We expect all employees to maintain a high level of professionalism.</p>
    <h2>3. Contact</h2>
    <p>For questions, please contact HR at /contact.hrEmail/.</p>
  `,
  metadata: {
    'Effective Date': '2024-01-01',
    'Version': '1.2',
    'Department': 'All',
  },
};

export const DocumentPreview = ({
  template,
  variables,
  className,
}: DocumentPreviewProps) => {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const { organizationState } = useOrganization();
  const { data: settingsData } = useSettings('organization_variables', 
    organizationState.type === 'active'
  );

  const effectiveVariables = useMemo(() => {
    // Prioritize settings data over prop variables
    const settingsVariables: OrganizationVariables = settingsData?.settingValue 
      ? validateOrganizationVariables(settingsData.settingValue)
      : {};
    
    // Fallback to prop variables if settings data not available
    const propVariables: OrganizationVariables = variables.reduce(
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
    );

    return { ...propVariables, ...settingsVariables };
  }, [variables, settingsData]);

  const organization = organizationState.type === 'active' ? organizationState.currentOrganization : undefined;

  const renderedContent = useMemo(() => {
    if (!template) {
      return {
        header: '<div>Select a template to see a preview.</div>',
        footer: '',
        metadata: '',
        content: '',
      };
    }

    return {
      header: processTemplateContent(
        template.headerTemplate || '',
        organization,
        effectiveVariables,
      ),
      footer: processTemplateContent(
        template.footerTemplate || '',
        organization,
        effectiveVariables,
      ),
      metadata: processTemplateContent(
        template.metadataTemplate || '',
        organization,
        effectiveVariables,
      ),
      content: processTemplateContent(samplePolicy.content, organization, effectiveVariables),
    };
  }, [template, effectiveVariables]);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.controls}>
        <div className={styles.title}>Live Preview</div>
        <div className={styles.toggleGroup}>
          <Button
            variant={previewMode === 'mobile' ? 'primary' : 'ghost'}
            size="icon-sm"
            onClick={() => setPreviewMode('mobile')}
            aria-label="Mobile preview"
          >
            <Smartphone size={16} />
          </Button>
          <Button
            variant={previewMode === 'tablet' ? 'primary' : 'ghost'}
            size="icon-sm"
            onClick={() => setPreviewMode('tablet')}
            aria-label="Tablet preview"
          >
            <Tablet size={16} />
          </Button>
          <Button
            variant={previewMode === 'desktop' ? 'primary' : 'ghost'}
            size="icon-sm"
            onClick={() => setPreviewMode('desktop')}
            aria-label="Desktop preview"
          >
            <Monitor size={16} />
          </Button>
        </div>
      </div>
      <div className={styles.previewArea}>
        <div className={`${styles.previewFrame} ${styles[previewMode]}`}>
          <div className={styles.document}>
            {template ? (
              <>
                <header
                  className={styles.section}
                  dangerouslySetInnerHTML={{ __html: renderedContent.header }}
                />
                <main className={styles.mainContent}>
                  <h1>{samplePolicy.title}</h1>
                  <div
                    className={styles.section}
                    dangerouslySetInnerHTML={{ __html: renderedContent.metadata }}
                  />
                  <div
                    className={styles.policyBody}
                    dangerouslySetInnerHTML={{ __html: renderedContent.content }}
                  />
                </main>
                <footer
                  className={styles.section}
                  dangerouslySetInnerHTML={{ __html: renderedContent.footer }}
                />
              </>
            ) : (
              <div className={styles.noTemplate}>
                <p>Select a layout template to generate a preview.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};