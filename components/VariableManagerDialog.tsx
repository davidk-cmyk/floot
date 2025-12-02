import React, { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog';
import { toast } from 'sonner';
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

export const VariableManagerDialog = ({
  isOpen,
  onOpenChange,
  onAddVariable,
  existingVariables,
}: VariableManagerDialogProps) => {
  const [newVariableName, setNewVariableName] = useState('');
  const [variableNameError, setVariableNameError] = useState('');

  const handleAddVariable = () => {
    const trimmedName = newVariableName.trim();

    if (!trimmedName) {
      setVariableNameError('Variable name cannot be empty');
      return;
    }

    const fullVarName = trimmedName.startsWith('company.') ? trimmedName : `company.${trimmedName}`;

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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Variable</DialogTitle>
          <DialogDescription>
            Create a new custom variable for your organization. Variable names can only contain letters, numbers, dots, and
            underscores.
          </DialogDescription>
        </DialogHeader>
        <div className={styles.content}>
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
            placeholder="e.g., customField"
            autoFocus
          />
          {variableNameError && <p className={styles.error}>{variableNameError}</p>}
          <p className={styles.hint}>Will be prefixed with "company." if not already included</p>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddVariable} disabled={!newVariableName.trim()}>
            Add Variable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};