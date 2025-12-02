import React, { useMemo } from 'react';
import { useOrganizationVariables } from '../helpers/useOrganizationVariables';
import { getVariablesByCategory } from '../helpers/documentTemplateHelpers';
import { Switch } from './Switch';
import { Skeleton } from './Skeleton';
import styles from './VariableToggleSection.module.css';

interface VariableToggleSectionProps {
  sectionName: string;
  enabledVariables: Set<string>;
  onTemplateChange: (template: string) => void;
}

// Generate template from enabled variables
const generateTemplate = (
  enabledVariables: Set<string>,
  allVariables: Array<{ key: string; label: string; example: string }>
): string => {
  const variableMap = new Map(allVariables.map(v => [v.key, v]));
  const lines: string[] = [];
  
  for (const varKey of enabledVariables) {
    const variable = variableMap.get(varKey);
    if (variable) {
      lines.push(`${variable.label}: /${variable.key}/`);
    }
  }
  
  return lines.join('\n');
};

export const VariableToggleSection = ({
  sectionName,
  enabledVariables,
  onTemplateChange,
}: VariableToggleSectionProps) => {
  const { data: customVariablesData, isFetching: isLoadingCustomVariables } = useOrganizationVariables();
  
  // Transform custom variables to match the expected format
  const customVariables = useMemo(() => {
    if (!customVariablesData) return [];
    return customVariablesData
      .filter(v => !v.isSystemVariable)
      .map(v => ({
        key: `company.${v.variableName}`,
        label: v.variableName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        example: v.variableValue || '',
      }));
  }, [customVariablesData]);

  // Get all variables grouped by category
  const variableCategories = useMemo(() => {
    return getVariablesByCategory(customVariables);
  }, [customVariables]);

  // Flatten all variables for easy lookup
  const allVariables = useMemo(() => {
    return variableCategories.flatMap(cat => cat.variables);
  }, [variableCategories]);

  const toggleVariable = (variableKey: string, isChecked: boolean) => {
    console.log('[VariableToggleSection.toggleVariable] Called with:', { variableKey, isChecked, currentEnabledVariables: Array.from(enabledVariables) });
    
    // Create new set with the toggle applied
    const nextEnabledVariables = new Set(enabledVariables);
    if (isChecked) {
      nextEnabledVariables.add(variableKey);
    } else {
      nextEnabledVariables.delete(variableKey);
    }
    
    // Generate the new template and call onTemplateChange directly
    const newTemplate = generateTemplate(nextEnabledVariables, allVariables);
    console.log('[VariableToggleSection.toggleVariable] Generated template:', { newTemplate, nextEnabledVariables: Array.from(nextEnabledVariables) });
    onTemplateChange(newTemplate);
  };

  if (isLoadingCustomVariables) {
    return (
      <div className={styles.container}>
        <h4 className={styles.sectionTitle}>{sectionName}</h4>
        <Skeleton style={{ height: '200px', width: '100%' }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h4 className={styles.sectionTitle}>{sectionName}</h4>
      <div className={styles.variableToggleList}>
        {variableCategories.map((category) => (
          <div key={category.category} className={styles.variableToggleGroup}>
            <div className={styles.variableToggleGroupTitle}>{category.category}</div>
            {category.variables.map((variable) => {
              const isUsed = enabledVariables.has(variable.key);
              return (
                <div key={variable.key} className={styles.variableToggleItem}>
                  <Switch
                    checked={isUsed}
                    onCheckedChange={(checked) => toggleVariable(variable.key, checked)}
                  />
                  <label>
                    <span className={styles.variableToggleLabel}>{variable.label}</span>
                    <span className={styles.variableToggleKey}>/{variable.key}/</span>
                  </label>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};