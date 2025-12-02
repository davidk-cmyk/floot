import React from 'react';
import { z } from 'zod';
import { useForm, Form, FormItem, FormLabel, FormControl, FormMessage } from './Form';
import { Input } from './Input';
import { Button } from './Button';
import { useCreateOrganization } from '../helpers/useOrganizationApi';
import { schema as createOrgSchema } from '../endpoints/organizations/register_POST.schema';
import styles from './CreateOrganizationForm.module.css';
import { PlusCircle } from 'lucide-react';

export const CreateOrganizationForm = () => {
  const createOrganizationMutation = useCreateOrganization();

  const form = useForm({
    schema: createOrgSchema,
    defaultValues: {
      organizationName: '',
      organizationSlug: '',
      adminDisplayName: 'Admin',
      adminEmail: 'admin@example.com',
      adminPassword: 'temppassword123',
      domain: '',
    },
  });

  const onSubmit = (values: z.infer<typeof createOrgSchema>) => {
    // Generate slug from organization name
    const slug = values.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    createOrganizationMutation.mutate({
      ...values,
      organizationSlug: slug,
    }, {
      onSuccess: () => {
        form.setValues({
          organizationName: '',
          organizationSlug: '',
          adminDisplayName: 'Admin',
          adminEmail: 'admin@example.com',
          adminPassword: 'temppassword123',
          domain: '',
        });
      },
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <PlusCircle size={24} />
        <h2 className={styles.cardTitle}>Create New Organization</h2>
      </div>
      <div className={styles.cardContent}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
            <FormItem name="organizationName">
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Acme Corporation"
                  value={form.values.organizationName}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, organizationName: e.target.value }))}
                  disabled={createOrganizationMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            <FormItem name="domain">
              <FormLabel>Associated Domain (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., acme.com"
                  value={form.values.domain || ''}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, domain: e.target.value }))}
                  disabled={createOrganizationMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            <Button type="submit" disabled={createOrganizationMutation.isPending} className={styles.submitButton}>
              {createOrganizationMutation.isPending ? 'Creating...' : 'Create Organization'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};