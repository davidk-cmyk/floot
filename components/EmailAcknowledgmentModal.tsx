import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog';
import {
  Form,
  useForm,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from './Form';
import { Input } from './Input';
import { Button } from './Button';
import { useRequestAcknowledgmentCode, useConfirmAcknowledgment } from '../helpers/useEmailAcknowledgmentApi';
import styles from './EmailAcknowledgmentModal.module.css';
import { Loader2 } from 'lucide-react';

interface EmailAcknowledgmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalSlug: string;
  policyId: number;
  policyTitle: string;
  onSuccess: (email: string) => void;
}

const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

const codeSchema = z.object({
  code: z.string().length(6, { message: 'Confirmation code must be 6 digits.' }).regex(/^\d+$/, { message: 'Code must only contain digits.' }),
});

export const EmailAcknowledgmentModal = ({
  isOpen,
  onClose,
  portalSlug,
  policyId,
  policyTitle,
  onSuccess,
}: EmailAcknowledgmentModalProps) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');

  const requestAcknowledgmentCode = useRequestAcknowledgmentCode();
  const confirmAcknowledgment = useConfirmAcknowledgment();

  const emailForm = useForm({
    schema: emailSchema,
    defaultValues: { email: '' },
  });

  const codeForm = useForm({
    schema: codeSchema,
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setTimeout(() => {
        setStep(1);
        setEmail('');
        emailForm.setValues({ email: '' });
        codeForm.setValues({ code: '' });
        requestAcknowledgmentCode.reset();
        confirmAcknowledgment.reset();
      }, 300); // Delay to allow for closing animation
    }
  }, [isOpen, emailForm, codeForm, requestAcknowledgmentCode, confirmAcknowledgment]);

  const handleSendCode = (values: z.infer<typeof emailSchema>) => {
    setEmail(values.email);
    requestAcknowledgmentCode.mutate(
      {
        portalSlug,
        policyId,
        email: values.email,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            setStep(2);
          } else {
            emailForm.setFieldError('email', data.message);
          }
        },
        onError: (error) => {
          if (error instanceof Error) {
            emailForm.setFieldError('email', error.message);
          } else {
            emailForm.setFieldError('email', 'An unknown error occurred.');
          }
        }
      }
    );
  };

  const handleVerifyCode = (values: z.infer<typeof codeSchema>) => {
    confirmAcknowledgment.mutate(
      {
        portalSlug,
        policyId,
        email,
        code: values.code,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            // Store email in sessionStorage for this portal
            sessionStorage.setItem(`visitor_email_${portalSlug}`, email);
            onSuccess(email);
            onClose();
          } else {
            codeForm.setFieldError('code', data.message);
          }
        },
        onError: (error) => {
          if (error instanceof Error) {
            codeForm.setFieldError('code', error.message);
          } else {
            codeForm.setFieldError('code', 'An unknown error occurred.');
          }
        }
      }
    );
  };

  const handleClose = () => {
    if (!requestAcknowledgmentCode.isPending && !confirmAcknowledgment.isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={styles.dialogContent}>
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Acknowledge Policy</DialogTitle>
              <DialogDescription>
                To acknowledge the policy "<strong>{policyTitle}</strong>", please enter your email address. A confirmation code will be sent to you.
              </DialogDescription>
            </DialogHeader>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleSendCode)} className={styles.form}>
                <FormItem name="email">
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      value={emailForm.values.email}
                      onChange={(e) => emailForm.setValues({ email: e.target.value })}
                      disabled={requestAcknowledgmentCode.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={handleClose} disabled={requestAcknowledgmentCode.isPending}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={requestAcknowledgmentCode.isPending}>
                    {requestAcknowledgmentCode.isPending && <Loader2 className={styles.spinner} />}
                    Send Code
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Enter Confirmation Code</DialogTitle>
              <DialogDescription>
                A 6-digit confirmation code has been sent to <strong>{email}</strong>. Please enter it below to complete the acknowledgment.
              </DialogDescription>
            </DialogHeader>
            <Form {...codeForm}>
              <form onSubmit={codeForm.handleSubmit(handleVerifyCode)} className={styles.form}>
                <FormItem name="code">
                  <FormLabel>Confirmation Code</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      maxLength={6}
                      pattern="\d{6}"
                      placeholder="123456"
                      value={codeForm.values.code}
                      onChange={(e) => codeForm.setValues({ code: e.target.value.replace(/\D/g, '') })}
                      disabled={confirmAcknowledgment.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={confirmAcknowledgment.isPending}>
                    Back
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleClose} disabled={confirmAcknowledgment.isPending}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={confirmAcknowledgment.isPending}>
                    {confirmAcknowledgment.isPending && <Loader2 className={styles.spinner} />}
                    Verify & Acknowledge
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};