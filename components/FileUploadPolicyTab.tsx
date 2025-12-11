import React from 'react';
import { FileUploadTab } from './FileUploadTab';

interface FileUploadPolicyTabProps {
  onContentExtracted: (title: string, content: string) => void;
  onBulkUploadComplete?: (policies: Array<{id: number; title: string}>) => void;
  className?: string;
}

export const FileUploadPolicyTab: React.FC<FileUploadPolicyTabProps> = ({
  onContentExtracted,
  onBulkUploadComplete,
  className,
}) => {
  return (
    <FileUploadTab
      onContentExtracted={onContentExtracted}
      onBulkUploadComplete={onBulkUploadComplete}
      className={className}
    />
  );
};