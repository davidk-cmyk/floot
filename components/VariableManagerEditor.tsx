import React, { useCallback } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion';
import { Input } from './Input';
import { Button } from './Button';
import { Form, FormItem, FormControl, FormMessage } from './Form';
import { Trash2, Lock, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import styles from './VariableManagerEditor.module.css';

const SYSTEM_VARIABLES = [
  'company.name',
  'company.email',
  'company.address',
  'company.phone',
];

interface VariableItem {
  variableName: string;
  variableValue: string;
}

interface VariableManagerEditorProps {
  variables: VariableItem[];
  onAddVariable: () => void;
  onRemoveVariable: (index: number) => void;
  onUpdateVariable: (index: number, field: 'variableName' | 'variableValue', value: string) => void;
}

export const VariableManagerEditor = ({
  variables,
  onAddVariable,
  onRemoveVariable,
  onUpdateVariable,
}: VariableManagerEditorProps) => {
  const isSystem = (variableName: string) => SYSTEM_VARIABLES.includes(variableName);

  const renderVariableField = (variable: VariableItem, index: number) => {
    const isSystemVar = isSystem(variable.variableName);

    return (
      <FormItem key={index} name={`variables.${index}.variableValue`}>
        <div className={styles.fieldRow}>
          <div className={styles.variableInfo}>
            <div className={styles.variableName}>
              {isSystemVar && <Lock size={12} className={styles.lockIcon} />}
              <code>{variable.variableName}</code>
            </div>
            {isSystemVar && <span className={styles.systemLabel}>System Variable</span>}
          </div>
          <FormControl>
            <Input
              value={variable.variableValue}
              onChange={(e) => onUpdateVariable(index, 'variableValue', e.target.value)}
              placeholder={`Enter value for ${variable.variableName}`}
            />
          </FormControl>
          {!isSystemVar && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemoveVariable(index)}
              aria-label={`Remove ${variable.variableName}`}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
        <FormMessage />
      </FormItem>
    );
  };

  return (
    <div className={styles.card}>
      <Accordion type="multiple" defaultValue={["all-variables"]} className={styles.accordion}>
        <AccordionItem value="all-variables">
          <AccordionTrigger>Custom Variables ({variables.length})</AccordionTrigger>
          <AccordionContent>
            <div className={styles.categoryContent}>
              {variables.map((variable, index) => renderVariableField(variable, index))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddVariable}
                className={styles.addButton}
              >
                <PlusCircle size={16} />
                Add Custom Variable
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};