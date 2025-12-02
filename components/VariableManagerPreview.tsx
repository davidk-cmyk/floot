import React, { useState, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';
import { Textarea } from './Textarea';
import { processVariables, VariableDataContext } from '../helpers/variableProcessor';
import { useOrganization } from '../helpers/useOrganization';
import styles from './VariableManagerPreview.module.css';

interface VariableItem {
  variableName: string;
  variableValue: string;
}

const SYSTEM_VARIABLES = [
  'company.name',
  'company.email',
  'company.address',
  'company.phone',
];

interface VariableManagerPreviewProps {
  variables: VariableItem[];
}

export const VariableManagerPreview = ({ variables }: VariableManagerPreviewProps) => {
  const { organizationState } = useOrganization();
  const [previewInput, setPreviewInput] = useState(
    'Hello {{company.name}} team!\n\nThis policy is effective as of {{policy.effectiveDate}} and applies to all {{company.name}} employees.'
  );
  const [processedPreview, setProcessedPreview] = useState('');

  const generatePreview = useCallback(() => {
    const currentOrganization = organizationState.type === 'active' ? organizationState.currentOrganization : undefined;

    // Build context for variable processor
    const context: VariableDataContext = {
      organization: {
        name: currentOrganization?.name,
        custom: {},
      },
      policy: {
        title: 'Sample Policy Title',
        currentVersion: 1.0,
        effectiveDate: new Date(),
        department: 'Human Resources',
      },
      document: {
        pageNumber: 1,
        totalPages: 5,
      },
    };

    // Add variables to context
    variables.forEach((v) => {
      if (v.variableName.startsWith('company.') && !SYSTEM_VARIABLES.includes(v.variableName)) {
        const customKey = v.variableName.substring('company.'.length);
        if (context.organization?.custom) {
          context.organization.custom[customKey] = v.variableValue;
        }
      } else if (SYSTEM_VARIABLES.includes(v.variableName)) {
        const key = v.variableName.substring('company.'.length) as keyof typeof context.organization;
        if (context.organization && key in context.organization) {
          (context.organization as any)[key] = v.variableValue;
        }
      }
    });

    const processed = processVariables(previewInput, context);
    setProcessedPreview(processed);
  }, [previewInput, variables, organizationState]);

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  return (
    <div className={styles.card}>
      <div className={styles.previewContainer}>
        <div className={styles.previewPane}>
          <label className={styles.label}>Template Input</label>
          <Textarea
            value={previewInput}
            onChange={(e) => setPreviewInput(e.target.value)}
            rows={8}
            placeholder="Type content with variables like {{company.name}}..."
          />
        </div>
        <div className={styles.previewPane}>
          <label className={styles.label}>Live Output</label>
          <div className={styles.previewOutput}>{processedPreview}</div>
        </div>
      </div>
      <div className={styles.infoBox}>
        <Info size={16} />
        <div>
          <p>The preview uses the current, unsaved values from the editor. Save your changes to make them available across the platform.</p>
          <p>
            <strong>Supported variable types:</strong>
          </p>
          <ul>
            <li>
              Policy: <code>{`{{policy.title}}`}</code>, <code>{`{{policy.effectiveDate}}`}</code>
            </li>
            <li>
              Document: <code>{`{{document.pageNumber}}`}</code>, <code>{`{{document.totalPages}}`}</code>
            </li>
            <li>
              Company: <code>{`{{company.name}}`}</code>, <code>{`{{company.email}}`}</code>
            </li>
            <li>Custom: Any variable you define above</li>
          </ul>
        </div>
      </div>
    </div>
  );
};