import React, { useState, useEffect } from 'react';
import { FormItem, FormLabel, FormControl, FormMessage, FormDescription } from './Form';
import { Textarea } from './Textarea';
import { Button } from './Button';
import { Mail, X } from 'lucide-react';
import styles from './PortalFormEmailRecipients.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PortalFormEmailRecipientsProps = {
  emailRecipients: string[];
  onChange: (emails: string[]) => void;
};

export const PortalFormEmailRecipients: React.FC<PortalFormEmailRecipientsProps> = ({
  emailRecipients,
  onChange,
}) => {
  const [emailInputText, setEmailInputText] = useState('');

  // Initialize input text from existing recipients
  useEffect(() => {
    if (emailRecipients.length > 0 && !emailInputText) {
      setEmailInputText(emailRecipients.join(', '));
    }
  }, [emailRecipients, emailInputText]);

  const parseEmails = (text: string): string[] => {
    return text
      .split(',')
      .map(email => email.trim())
      .filter(email => email && EMAIL_REGEX.test(email));
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setEmailInputText(text);
    const validEmails = parseEmails(text);
    onChange(validEmails);
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const updatedEmails = emailRecipients.filter(email => email !== emailToRemove);
    onChange(updatedEmails);
    setEmailInputText(updatedEmails.join(', '));
  };

  const validEmailCount = emailRecipients.length;

  return (
    <div className={styles.container}>
      <FormItem name="emailRecipients">
        <div className={styles.header}>
          <Mail className={styles.headerIcon} />
          <div>
            <FormLabel>Target Email Recipients</FormLabel>
            <FormDescription>
              Add email addresses that need to acknowledge policies in this portal. Enter emails separated by commas.
            </FormDescription>
          </div>
        </div>

        <FormControl>
          <Textarea
            placeholder="e.g., alice@company.com, bob@company.com, charlie@company.com"
            value={emailInputText}
            onChange={handleEmailInputChange}
            rows={3}
          />
        </FormControl>

        {emailInputText && (
          <div className={styles.emailCount}>
            <Mail size={14} className={styles.emailCountIcon} />
            <span className={styles.emailCountText}>
              {validEmailCount} valid {validEmailCount === 1 ? 'email' : 'emails'} detected
            </span>
          </div>
        )}

        <FormMessage />
      </FormItem>

      {emailRecipients.length > 0 && (
        <div className={styles.recipientsList}>
          <div className={styles.recipientsHeader}>Current Recipients:</div>
          <div className={styles.recipientsGrid}>
            {emailRecipients.map((email) => (
              <div key={email} className={styles.recipientItem}>
                <Mail size={14} className={styles.recipientIcon} />
                <span className={styles.recipientEmail}>{email}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveEmail(email)}
                  className={styles.removeButton}
                  aria-label={`Remove ${email}`}
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};