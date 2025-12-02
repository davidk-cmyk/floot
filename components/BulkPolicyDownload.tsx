import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './Dialog';
import { Button } from './Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select';
import { DownloadCloud } from 'lucide-react';
import { useBulkDownloadPolicies } from '../helpers/usePolicyDownloadApi';
import {
  DownloadFormat,
  supportedFormats,
} from '../endpoints/policies/download_POST.schema';
import styles from './BulkPolicyDownload.module.css';

interface BulkPolicyDownloadProps {
  policyIds: number[];
  className?: string;
}

export const BulkPolicyDownload: React.FC<BulkPolicyDownloadProps> = ({
  policyIds,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<DownloadFormat>('pdf');
  const bulkDownload = useBulkDownloadPolicies();

  const selectedCount = policyIds.length;

  const handleDownload = () => {
    if (selectedCount > 0) {
      bulkDownload.mutate(
        { policyIds: policyIds as [number, ...number[]], format },
        {
          onSuccess: () => {
            setIsOpen(false);
          },
        },
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className={className}
          disabled={selectedCount === 0}
        >
          <DownloadCloud size={16} />
          Download ({selectedCount})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Download Policies</DialogTitle>
          <DialogDescription>
            You have selected {selectedCount} policies. Choose a format to
            download them as a single ZIP archive.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.content}>
          <label htmlFor="bulk-download-format" className={styles.label}>
            Download Format
          </label>
          <Select
            value={format}
            onValueChange={(value) => setFormat(value as DownloadFormat)}
          >
            <SelectTrigger id="bulk-download-format">
              <SelectValue placeholder="Select a format" />
            </SelectTrigger>
            <SelectContent>
              {supportedFormats.map((f) => (
                <SelectItem key={f} value={f}>
                  {f.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setIsOpen(false)}
            disabled={bulkDownload.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={bulkDownload.isPending}>
            {bulkDownload.isPending
              ? 'Generating...'
              : `Download ${selectedCount} policies`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};