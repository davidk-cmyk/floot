import React, { useState } from 'react';
import * as z from 'zod';
import { Clipboard, Copy, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { generateInviteLink } from '../helpers/generateInviteLink';

import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from './Form';
import { Input } from './Input';
import { Button } from './Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './Dialog';
import { useUserManagement } from '../helpers/useUserManagement';
import { schema as createUserSchema } from '../endpoints/users/create_POST.schema';
import { UserRoleArrayValues } from '../helpers/schema';
import styles from './UserCreateForm.module.css';

type CreatedUserInfo = {
  password?: string;
  email?: string;
};

const roleDescriptions = {
  superadmin: 'Full access to all features, settings, and user management. Can create and manage all policies and portals.',
  approver: 'Can review and approve policy drafts before publication. Cannot modify system settings.',
  editor: 'Can create, edit, and publish policies. Cannot access user management or system settings.',
  user: 'Can view assigned policies and acknowledge them. Read-only access to portal content.',
};

const roleComingSoon = ['approver', 'user'];

export const UserCreateForm = () => {
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [createdUserInfo, setCreatedUserInfo] = useState<CreatedUserInfo | null>(null);
  const { useCreateUser } = useUserManagement();

  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'user' as const,
  };

  const form = useForm({
    schema: createUserSchema,
    defaultValues,
  });

  const createUserMutation = useCreateUser();

  const onSubmit = (values: z.infer<typeof createUserSchema>) => {
    createUserMutation.mutate(values, {
      onSuccess: (data) => {
        setCreatedUserInfo({ password: data.password, email: values.email });
        setIsSuccessDialogOpen(true);
        form.setValues(defaultValues);
      },
    });
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(`${label} copied to clipboard!`);
      },
      (err) => {
        toast.error('Failed to copy to clipboard.');
        console.error('Could not copy text: ', err);
      },
    );
  };

  const inviteUrl = createdUserInfo?.email 
    ? generateInviteLink({ email: createdUserInfo.email })
    : '';

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.quickGuide}>
            <div className={styles.guideHeader}>
              <Lightbulb size={18} className={styles.guideIcon} />
              <span className={styles.guideTitle}>Understanding User Roles</span>
            </div>
            <div className={styles.guideContent}>
              {Object.entries(roleDescriptions).map(([role, description]) => (
                <div key={role} className={styles.roleItem}>
                  <div className={styles.roleTitle}>
                    <strong>{role.charAt(0).toUpperCase() + role.slice(1)}</strong>
                    {roleComingSoon.includes(role) && (
                      <span className={styles.comingSoonBadge}>COMING SOON</span>
                    )}
                  </div>
                  <p className={styles.roleDescription}>{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.nameFields}>
            <FormItem name="firstName" className={styles.formField}>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John"
                  value={form.values.firstName}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  disabled={createUserMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            <FormItem name="lastName" className={styles.formField}>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Doe"
                  value={form.values.lastName}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  disabled={createUserMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <FormItem name="email" className={styles.formField}>
            <FormLabel>Email Address</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="john.doe@example.com"
                value={form.values.email}
                onChange={(e) =>
                  form.setValues((prev) => ({ ...prev, email: e.target.value }))
                }
                disabled={createUserMutation.isPending}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="role" className={styles.formField}>
            <FormLabel>Role</FormLabel>
            <Select
              onValueChange={(value) =>
                form.setValues((prev) => ({ ...prev, role: value as z.infer<typeof createUserSchema>['role'] }))
              }
              value={form.values.role}
              disabled={createUserMutation.isPending}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {UserRoleArrayValues.map((role) => (
                  <SelectItem 
                    key={role} 
                    value={role} 
                    className={styles.selectItem}
                    disabled={roleComingSoon.includes(role)}
                  >
                    <div className={styles.selectItemContent}>
                      {role === 'admin' ? 'Superadmin' : role.charAt(0).toUpperCase() + role.slice(1)}
                      {roleComingSoon.includes(role) && (
                        <span className={styles.selectItemSoon}> (COMING SOON)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              The user's role determines their permissions.
            </FormDescription>
            <FormMessage />
          </FormItem>

          <Button
            type="submit"
            disabled={createUserMutation.isPending}
            className={styles.submitButton}
          >
            {createUserMutation.isPending ? 'Creating User...' : 'Create User'}
          </Button>
        </form>
      </Form>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Created Successfully</DialogTitle>
          <DialogDescription>
            The user account for {createdUserInfo?.email} has been created. Please securely share both the temporary password and personalized invite link with the new user.
          </DialogDescription>
          </DialogHeader>
          
          <div className={styles.dialogSection}>
            <label className={styles.dialogLabel}>Temporary Password</label>
            <div className={styles.copyableContent}>
              <span className={styles.passwordText}>{createdUserInfo?.password}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleCopyToClipboard(createdUserInfo?.password || '', 'Password')}
                aria-label="Copy password"
              >
                <Copy size={16} />
              </Button>
            </div>
            <p className={styles.dialogInstruction}>The user will be required to change this password upon first login.</p>
          </div>

          <div className={styles.dialogSection}>
            <label className={styles.dialogLabel}>Personalized Invite Link</label>
            <div className={styles.copyableContent}>
              <span className={styles.linkText}>{inviteUrl}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleCopyToClipboard(inviteUrl, 'Invite link')}
                aria-label="Copy invite link"
              >
                <Copy size={16} />
              </Button>
            </div>
             <p className={styles.dialogInstruction}>This link pre-fills the user's email on the login page for a smoother onboarding experience.</p>
          </div>

          <div className={styles.dialogSection}>
            <label className={styles.dialogLabel}>Complete Invitation Message</label>
            <div className={styles.invitationSnippet}>
              <div className={styles.snippetContent}>
                {`Welcome to our Policy Management Platform!

You've been invited to join our organization's policy management system, where you can access, review, and acknowledge important company policies and procedures.

To get started:
1. Click this personalized login link: ${inviteUrl}
2. Use this temporary password: ${createdUserInfo?.password}
3. You'll be prompted to create a new password during your first login

This platform helps ensure everyone stays informed about our latest policies and compliance requirements. If you have any questions about accessing the system, please don't hesitate to reach out.

Best regards`}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleCopyToClipboard(
                  `Welcome to our Policy Management Platform!

You've been invited to join our organization's policy management system, where you can access, review, and acknowledge important company policies and procedures.

To get started:
1. Click this personalized login link: ${inviteUrl}
2. Use this temporary password: ${createdUserInfo?.password}
3. You'll be prompted to create a new password during your first login

This platform helps ensure everyone stays informed about our latest policies and compliance requirements. If you have any questions about accessing the system, please don't hesitate to reach out.

Best regards`,
                  'Invitation message'
                )}
                aria-label="Copy invitation message"
                className={styles.copyButton}
              >
                <Copy size={16} />
              </Button>
            </div>
            <p className={styles.dialogInstruction}>This is a complete message you can send directly to the new user via email or your preferred communication method.</p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="primary">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};