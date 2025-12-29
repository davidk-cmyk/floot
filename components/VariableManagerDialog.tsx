import React, { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import styles from './VariableManagerDialog.module.css';

interface VariableItem {
  variableName: string;
  variableValue: string;
}

interface VariableManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVariable: (variableName: string) => void;
  existingVariables: VariableItem[];
}

const SUGGESTED_VARIABLES = [
  { name: 'ceo_name', label: 'CEO Name', example: 'John Smith' },
  { name: 'company_address', label: 'Company Address', example: '123 Business Street' },
  { name: 'dpo_email', label: 'DPO Contact', example: 'dpo@company.com' },
  { name: 'hr_contact', label: 'HR Email', example: 'hr@company.com' },
  { name: 'emergency_number', label: 'Emergency Number', example: '+1-555-0000' },
  { name: 'head_office_location', label: 'Head Office Location', example: 'New York, NY' },
];

export const VariableManagerDialog = ({
  isOpen,
  onOpenChange,
  onAddVariable,
  existingVariables,
}: VariableManagerDialogProps) => {
  const [newVariableName, setNewVariableName] = useState('');
  const [variableNameError, setVariableNameError] = useState('');

  const handleAddVariable = (name?: string) => {
    const nameToAdd = (name ?? newVariableName).trim();

    if (!nameToAdd) {
      setVariableNameError('Variable name cannot be empty');
      return;
    }

    const fullVarName = nameToAdd.startsWith('company.') ? nameToAdd : `company.${nameToAdd}`;

    if (!/^[a-zA-Z0-9_.]+$/.test(fullVarName)) {
      setVariableNameError('Variable name can only contain letters, numbers, dots, and underscores');
      return;
    }

    const existingVar = existingVariables.find((v) => v.variableName === fullVarName);
    if (existingVar) {
      setVariableNameError(`Variable "${fullVarName}" already exists`);
      return;
    }

    onAddVariable(fullVarName);
    setNewVariableName('');
    setVariableNameError('');
    onOpenChange(false);
    toast.success(`Variable "${fullVarName}" added successfully`);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNewVariableName('');
      setVariableNameError('');
    }
    onOpenChange(open);
  };

  const handleQuickAdd = (suggestedName: string) => {
    handleAddVariable(suggestedName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle>Add Custom Variable</DialogTitle>
          <DialogDescription>
            Create a new variable for your organization. Use lowercase with underscores (e.g., ceo_name, not CEO Name).
          </DialogDescription>
        </DialogHeader>
        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Variable Name</label>
            <Input
              value={newVariableName}
              onChange={(e) => {
                setNewVariableName(e.target.value);
                setVariableNameError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddVariable();
                }
              }}
              placeholder="e.g., ceo_name, company_address"
              autoFocus
            />
            {variableNameError && <p className={styles.error}>{variableNameError}</p>}
            <p className={styles.hint}>Will be prefixed with "company." if not already included</p>
          </div>

          <div className={styles.suggestionsSection}>
            <p className={styles.suggestionsTitle}>Quick Start: Add common variables</p>
            <div className={styles.suggestionsList}>
              {SUGGESTED_VARIABLES.map((suggestion) => {
                const isExisting = existingVariables.some(
                  (v) => v.variableName === `company.${suggestion.name}`
                );
                return (
                  <Button
                    key={suggestion.name}
                    type="button"
                    variant={isExisting ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickAdd(suggestion.name)}
                    disabled={isExisting}
                    className={styles.suggestionButton}
                    title={isExisting ? 'Already added' : `Add ${suggestion.label}`}
                  >
                    <Plus size={14} />
                    {suggestion.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleAddVariable()} disabled={!newVariableName.trim()}>
            Add Variable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};