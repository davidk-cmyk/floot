import React from 'react';
import { FileUploadTab } from './FileUploadTab';

interface FileUploadPolicyTabProps {
  onContentExtracted: (title: string, content: string) => void;
  className?: string;
}

export const FileUploadPolicyTab: React.FC<FileUploadPolicyTabProps> = ({
  onContentExtracted,
  className,
}) => {
  return (
    <FileUploadTab
      onContentExtracted={onContentExtracted}
      className={className}
    />
  );
};