import React from 'react';
import { PolicyWithAuthor } from '../endpoints/policies/get_POST.schema';
import { OutputType as DocumentLayoutSettings } from '../endpoints/document-layout_GET.schema';
import { useOrganization } from '../helpers/useOrganization';
import { useOrganizationVariables } from '../helpers/useOrganizationVariables';
import { processVariables, VariableDataContext } from '../helpers/variableProcessor';
import { PolicyMetadata } from './PolicyMetadata';
import { PolicyContent } from './PolicyContent';
import styles from './DocumentView.module.css';

interface DocumentViewProps {
  policy: PolicyWithAuthor;
  layoutSettings: DocumentLayoutSettings;
  className?: string;
}

// Helper to convert /variable.name/ syntax to {{variable.name}} syntax
const convertTemplateSyntax = (template: string): string => {
  return template.replace(/\/([^\/]+)\//g, '{{$1}}');
};

// Helper to convert processed template with line breaks to JSX
const renderProcessedTemplate = (processedText: string): React.ReactNode => {
  const lines = processedText.split('\n');
  
  return lines.map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};

export const DocumentView: React.FC<DocumentViewProps> = ({ policy, layoutSettings, className }) => {
  const { organizationState } = useOrganization();
  const { data: orgVariables = [] } = useOrganizationVariables();
  
  const currentOrganization =
    organizationState.type === 'active' || organizationState.type === 'switching'
      ? organizationState.currentOrganization
      : undefined;

  // Build the data context for variableProcessor
  const variableContext: VariableDataContext = {
    policy: {
      title: policy.title,
      currentVersion: policy.currentVersion ?? 1,
      effectiveDate: policy.effectiveDate,
      department: policy.department,
      category: policy.category,
      tags: policy.tags,
      expirationDate: policy.expirationDate,
    },
    organization: {
      name: currentOrganization?.name ?? null,
      // Build custom variables from organization variables
      custom: orgVariables.reduce((acc, v) => {
        if (v.variableValue) {
          acc[v.variableName] = v.variableValue;
        }
        return acc;
      }, {} as Record<string, string>),
    },
    document: {
      pageNumber: 1,
      totalPages: 1,
      printDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      printTime: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  };

  // Convert template syntax and process templates
  const convertedHeaderTemplate = convertTemplateSyntax(layoutSettings.headerTemplate);
  const convertedFooterTemplate = convertTemplateSyntax(layoutSettings.footerTemplate);

  const processedHeader = processVariables(convertedHeaderTemplate, variableContext);
  const processedFooter = processVariables(convertedFooterTemplate, variableContext);

  return (
    <div className={`${styles.printContainer} ${className || ''}`}>
      <div className={styles.page}>
        {processedHeader && (
          <div className={styles.header}>
            {renderProcessedTemplate(processedHeader)}
          </div>
        )}

        <div className={styles.mainContent}>
          <h1 className={styles.policyTitle}>{policy.title}</h1>
          {layoutSettings.showMetadata && <PolicyMetadata policy={policy} className={styles.metadata} />}
          
          {/* PolicyContent expects a ref, but for preview it's not needed */}
          <PolicyContent policy={policy} contentContainerRef={{ current: null }} />
        </div>

        {processedFooter && (
          <div className={styles.footer}>
            {renderProcessedTemplate(processedFooter)}
          </div>
        )}
      </div>
    </div>
  );
};