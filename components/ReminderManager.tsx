import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Bell, Mail, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useEmailAcknowledgmentPending } from '../helpers/useEmailAcknowledgmentApi';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Badge } from './Badge';
import { Skeleton } from './Skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from './Dialog';
import { Textarea } from './Textarea';
import styles from './ReminderManager.module.css';

const DEFAULT_REMINDER_MESSAGE = `Hi,

This is a friendly reminder that you have an outstanding policy acknowledgement required for "{policyTitle}".

Please review and acknowledge this policy at your earliest convenience.

If you have any questions, please contact your administrator.

Thank you,
Management`;

const ReminderRowSkeleton = () => (
  <tr className={styles.tableRow}>
    <td className={styles.tableCell}><Skeleton style={{ width: '1.25rem', height: '1.25rem', borderRadius: 'var(--radius-sm)' }} /></td>
    <td className={styles.tableCell}><Skeleton style={{ width: '180px', height: '1rem' }} /></td>
    <td className={styles.tableCell}><Skeleton style={{ width: '200px', height: '1rem' }} /></td>
    <td className={styles.tableCell}><Skeleton style={{ width: '120px', height: '1rem' }} /></td>
    <td className={styles.tableCell}><Skeleton style={{ width: '80px', height: '1.5rem' }} /></td>
  </tr>
);

export const ReminderManager = ({ className }: { className?: string }) => {
  const [selectedReminders, setSelectedReminders] = useState<Set<string>>(new Set());
  const [reminderMessage, setReminderMessage] = useState(DEFAULT_REMINDER_MESSAGE);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isFetching, error } = useEmailAcknowledgmentPending();

  const pendingReminders = useMemo(() => data ?? [], [data]);

  // Generate a unique key for each reminder: email-policyId-portalId
  const getReminderKey = (email: string, policyId: number, portalId: number): string => {
    return `${email}-${policyId}-${portalId}`;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allKeys = new Set(
        pendingReminders.map(r => getReminderKey(r.email, r.policyId, r.portalId))
      );
      setSelectedReminders(allKeys);
    } else {
      setSelectedReminders(new Set());
    }
  };

  const handleSelectRow = (key: string) => {
    setSelectedReminders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isAllSelected = pendingReminders.length > 0 && selectedReminders.size === pendingReminders.length;
  const isIndeterminate = selectedReminders.size > 0 && !isAllSelected;

  const renderContent = () => {
    if (isFetching) {
      return (
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => <ReminderRowSkeleton key={i} />)}
        </tbody>
      );
    }

    if (error) {
      return (
        <tbody>
          <tr>
            <td colSpan={5} className={styles.emptyState}>
              <AlertTriangle className={styles.emptyIcon} />
              <p>Error fetching pending acknowledgements.</p>
              <p className={styles.errorMessage}>{error.message}</p>
            </td>
          </tr>
        </tbody>
      );
    }

    if (pendingReminders.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={5} className={styles.emptyState}>
              <CheckCircle className={styles.emptyIcon} />
              <p>All caught up!</p>
              <p>There are no pending email-based policy acknowledgements.</p>
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {pendingReminders.map((reminder) => {
          const reminderKey = getReminderKey(reminder.email, reminder.policyId, reminder.portalId);
          return (
            <tr key={reminderKey} className={styles.tableRow}>
              <td className={styles.tableCell}>
                <Checkbox
                  checked={selectedReminders.has(reminderKey)}
                  onChange={() => handleSelectRow(reminderKey)}
                  aria-label={`Select reminder for ${reminder.email}`}
                />
              </td>
              <td className={styles.tableCell}>{reminder.email}</td>
              <td className={styles.tableCell}>{reminder.policyTitle}</td>
              <td className={styles.tableCell}>{reminder.portalName}</td>
              <td className={styles.tableCell}>
                <Badge variant="warning">Pending</Badge>
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Bell className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Email Acknowledgement Reminders</h1>
            <p className={styles.description}>
              Manage and send acknowledgement reminders to users via email for policies in email-based portals.
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={true}>
              <Mail size={16} />
              Send Reminders (Coming Soon)
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Email Reminders</DialogTitle>
              <DialogDescription>
                The email reminder feature is coming soon. You'll be able to send reminder emails to {selectedReminders.size} recipient(s).
              </DialogDescription>
            </DialogHeader>
            <div className={styles.dialogBody}>
              <label htmlFor="reminderMessage" className={styles.label}>
                Reminder Message Template (Preview)
                <span className={styles.templateInfo}>
                  <Info size={14} />
                  Variables like {'{policyTitle}'} will be replaced automatically.
                </span>
              </label>
              <Textarea
                id="reminderMessage"
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                rows={8}
                disabled
              />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.tableHead}>
                <Checkbox
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  aria-label="Select all reminders"
                />
              </th>
              <th className={styles.tableHead}>Email</th>
              <th className={styles.tableHead}>Policy</th>
              <th className={styles.tableHead}>Portal</th>
              <th className={styles.tableHead}>Status</th>
            </tr>
          </thead>
          {renderContent()}
        </table>
      </div>
    </div>
  );
};