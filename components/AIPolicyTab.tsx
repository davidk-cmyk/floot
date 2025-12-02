import React from 'react';
import { AIPolicyGenerator } from './AIPolicyGenerator';

interface PolicyMetadata {
  department?: string;
  category?: string;
  tags?: string[];
  effectiveDate?: Date;
  expirationDate?: Date;
  reviewDate?: Date;
  versionNotes?: string;
}

interface AIPolicyTabProps {
  onPolicyGenerated: (content: string, metadata?: PolicyMetadata, switchToManual?: boolean) => void;
  initialValues: {
    topic: string;
    category: string;
    department: string;
    keyRequirements: string;
    tags: string[];
  };
  className?: string;
}

export const AIPolicyTab: React.FC<AIPolicyTabProps> = ({
  onPolicyGenerated,
  initialValues,
  className,
}) => {
  return (
    <AIPolicyGenerator
      onPolicyGenerated={onPolicyGenerated}
      initialValues={initialValues}
      className={className}
    />
  );
};