import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useOrganizationVariables, useUpdateOrganizationVariables } from '../helpers/useOrganizationVariables';
import { Skeleton } from './Skeleton';
import { Button } from './Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
import { Form, useForm } from './Form';
import { VariableManagerEditor } from './VariableManagerEditor';
import { VariableManagerPreview } from './VariableManagerPreview';
import { VariableManagerGuide } from './VariableManagerGuide';
import { VariableManagerDialog } from './VariableManagerDialog';
import styles from './VariableManager.module.css';

const variableSchema = z.object({
  variableName: z
    .string()
    .min(1, 'Variable name cannot be empty')
    .regex(/^[a-zA-Z0-9_.]+$/, 'Variable name can only contain letters, numbers, dots, and underscores'),
  variableValue: z.string(),
});

const formSchema = z.object({
  variables: z.array(variableSchema),
});

type VariableFormData = z.infer<typeof formSchema>;

// Deep equality comparison helper
const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;

  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }

  if (typeof obj1 === 'object') {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
      if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
    }
    return true;
  }

  return obj1 === obj2;
};

export const VariableManager = () => {
  const { data: variables, isFetching: isLoadingVariables } = useOrganizationVariables();
  const { mutate: updateVariables, isPending: isUpdating } = useUpdateOrganizationVariables();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Transform database variables to form structure
  const transformVariablesToFormData = (dbVariables: typeof variables): VariableFormData => {
    if (!dbVariables) return { variables: [] };

    return {
      variables: dbVariables.map((v) => ({
        variableName: v.variableName,
        variableValue: v.variableValue || '',
      })),
    };
  };

  // Transform form data back to API structure
  const transformFormDataToVariables = (formData: VariableFormData) => {
    return formData.variables.filter((v) => v.variableName && v.variableName.trim());
  };

  const form = useForm({
    defaultValues: { variables: [] },
    schema: formSchema,
  });

  useEffect(() => {
    if (variables) {
      const formData = transformVariablesToFormData(variables);
      // Only update if the data has actually changed
      if (!deepEqual(formData, form.values)) {
        form.setValues(formData);
      }
    }
  }, [variables]);

  const onSubmit = (data: VariableFormData) => {
    const transformedData = transformFormDataToVariables(data);
    updateVariables({ variables: transformedData });
  };

  const handleAddVariable = (variableName: string) => {
    const newVariables = [
      ...form.values.variables,
      { variableName, variableValue: '' },
    ];
    form.setValues({ variables: newVariables });
  };

  const handleRemoveVariable = (index: number) => {
    const variable = form.values.variables[index];
    const SYSTEM_VARIABLES = [
      'company.name',
      'company.email',
      'company.address',
      'company.phone',
    ];

    if (SYSTEM_VARIABLES.includes(variable.variableName)) {
      // Silently prevent deletion of system variables - already handled by UI
      return;
    }

    const newVariables = [...form.values.variables];
    newVariables.splice(index, 1);
    form.setValues({ variables: newVariables });
  };

  const handleUpdateVariable = (index: number, field: 'variableName' | 'variableValue', value: string) => {
    const newVariables = [...form.values.variables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    form.setValues({ variables: newVariables });
  };

  if (isLoadingVariables) {
    return (
      <div className={styles.card}>
        <Skeleton style={{ height: '2rem', width: '250px', marginBottom: '0.5rem' }} />
        <Skeleton style={{ height: '1rem', width: '400px', marginBottom: '1.5rem' }} />
        <Skeleton style={{ height: '300px' }} />
      </div>
    );
  }

  return (
    <Form {...form}>
      <Tabs defaultValue="editor" className={styles.tabsContainer}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Organization Variables</h2>
            <p className={styles.description}>
              Define dynamic variables to personalize policy templates and content.
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="guide">Guide</TabsTrigger>
          </TabsList>
        </div>

        {/* Helpful Guide Section */}
        <div className={styles.helpGuideSection}>
          <div className={styles.helpGuideHeader}>
            <span className={styles.helpGuideLightbulb}>💡</span>
            <h3 className={styles.helpGuideTitle}>How Variables Work</h3>
          </div>
          <p className={styles.helpGuideText}>
            Create variables for information that appears frequently across your policies. When you update a variable here, it automatically updates everywhere it's used.
          </p>
          <div className={styles.examplesSection}>
            <p className={styles.examplesTitle}>Common Examples:</p>
            <ul className={styles.examplesList}>
              <li><code>company.name</code> - Company or organization name</li>
              <li><code>company.address</code> - Registered office address</li>
              <li><code>company.email</code> - General company email</li>
              <li><code>company.phone</code> - Company phone number</li>
              <li><code>dpo_email</code> - Data Protection Officer contact</li>
              <li><code>hr_contact</code> - HR department email or phone</li>
              <li><code>emergency_number</code> - Emergency contact number</li>
              <li><code>head_office_location</code> - Main office location</li>
              <li><code>company_registration</code> - Company registration number</li>
            </ul>
          </div>
          <p className={styles.helpGuideHint}>
            Simply use variables in your policies (type <code>/</code> in the editor), and they'll automatically populate with the values you set here.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <TabsContent value="editor">
            <VariableManagerEditor
              variables={form.values.variables}
              onAddVariable={() => setIsAddDialogOpen(true)}
              onRemoveVariable={handleRemoveVariable}
              onUpdateVariable={handleUpdateVariable}
            />
          </TabsContent>

          <TabsContent value="preview">
            <VariableManagerPreview variables={form.values.variables} />
          </TabsContent>

          <TabsContent value="guide">
            <VariableManagerGuide />
          </TabsContent>

          <div className={styles.formActions}>
            <Button type="submit" disabled={isUpdating || !form.isValid}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Tabs>

      <VariableManagerDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddVariable={handleAddVariable}
        existingVariables={form.values.variables}
      />
    </Form>
  );
};