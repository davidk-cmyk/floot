import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from '../components/Form';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useRegisterOrganization } from '../helpers/useOrganizationApi';
import { schema as registerOrganizationSchema } from '../endpoints/organizations/register_POST.schema';

import styles from './register-organization.module.css';

const formSchema = registerOrganizationSchema;

const RegisterOrganizationPage = () => {
  const navigate = useNavigate();
  const registerMutation = useRegisterOrganization();

  const form = useForm({
    schema: formSchema,
    defaultValues: {
      organizationName: '',
      organizationSlug: '',
      domain: '',
      adminDisplayName: '',
      adminEmail: '',
      adminPassword: '',
    },
  });

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValues((prev) => ({
      ...prev,
      organizationName: name,
    }));

    // Auto-generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
    
    form.setValues((prev) => ({
      ...prev,
      organizationSlug: slug,
    }));
    form.validateField('organizationSlug');
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    registerMutation.mutate(values, {
      onSuccess: (data) => {
        toast.success('Organization created successfully!');
        navigate(`/login/${data.organizationSlug}`);
      },
      onError: (error) => {
        if (error instanceof Error) {
          toast.error(`Registration failed: ${error.message}`);
        } else {
          toast.error('An unknown error occurred during registration.');
        }
      },
    });
  };

  return (
    <>
      <Helmet>
        <title>Create Organization | MyPolicyPortal</title>
        <meta name="description" content="Create a new organization account on MyPolicyPortal." />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Shield className={styles.logoIcon} size={32} />
            <h1 className={styles.title}>Create Your Organization</h1>
            <p className={styles.subtitle}>Set up your workspace and start managing policies.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Organization Details</legend>
                <FormItem name="organizationName">
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Corporation"
                      value={form.values.organizationName}
                      onChange={handleOrgNameChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem name="organizationSlug">
                  <FormLabel>Organization URL</FormLabel>
                  <FormControl>
                    <div className={styles.slugInputWrapper}>
                      <span className={styles.slugPrefix}>mypolicyportal.com/login/</span>
                      <Input
                        placeholder="acme-corp"
                        className={styles.slugInput}
                        value={form.values.organizationSlug}
                        onChange={(e) => form.setValues((prev) => ({ ...prev, organizationSlug: e.target.value }))}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>This will be your unique URL for logging in.</FormDescription>
                  <FormMessage />
                </FormItem>
                <FormItem name="domain">
                  <FormLabel>Company Domain (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="acme.com"
                      value={form.values.domain || ''}
                      onChange={(e) => form.setValues((prev) => ({ ...prev, domain: e.target.value }))}
                    />
                  </FormControl>
                  <FormDescription>Associate a domain with your organization.</FormDescription>
                  <FormMessage />
                </FormItem>
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Administrator Account</legend>
                <FormItem name="adminDisplayName">
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jane Doe"
                      value={form.values.adminDisplayName}
                      onChange={(e) => form.setValues((prev) => ({ ...prev, adminDisplayName: e.target.value }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem name="adminEmail">
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jane.doe@acme.com"
                      value={form.values.adminEmail}
                      onChange={(e) => form.setValues((prev) => ({ ...prev, adminEmail: e.target.value }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem name="adminPassword">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={form.values.adminPassword}
                      onChange={(e) => form.setValues((prev) => ({ ...prev, adminPassword: e.target.value }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </fieldset>

              <Button type="submit" disabled={registerMutation.isPending} className={styles.submitButton}>
                {registerMutation.isPending ? 'Creating...' : 'Create Organization'}
              </Button>
            </form>
          </Form>

          <div className={styles.footer}>
            <p>
              Already have an account?{' '}
              <Link to="/login" className={styles.link}>
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterOrganizationPage;