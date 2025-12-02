import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu';
import { Button } from './Button';
import { Download, FileText, FileCode, FileType, Loader2 } from 'lucide-react';
import { useDownloadPolicy } from '../helpers/usePolicyDownloadApi';
import { DownloadFormat } from '../endpoints/policies/download_POST.schema';
import styles from './PolicyDownloadButton.module.css';

interface PolicyDownloadButtonProps {
  policyId: number;
  policyTitle: string;
  className?: string;
  variant?: 'button' | 'icon';
  defaultFormat?: DownloadFormat;
}

const formatDetails: Record<
  DownloadFormat,
  { icon: React.ElementType; name: string; description: string }
> = {
  pdf: {
    icon: FileText,
    name: 'PDF',
    description: 'Best for printing and sharing.',
  },
  docx: {
    icon: FileType,
    name: 'DOCX',
    description: 'Microsoft Word compatible.',
  },
  md: {
    icon: FileCode,
    name: 'Markdown',
    description: 'Plain text for developers.',
  },
};

export const PolicyDownloadButton: React.FC<PolicyDownloadButtonProps> = ({
  policyId,
  policyTitle,
  className,
  variant = 'button',
  defaultFormat = 'docx',
}) => {
  const downloadPolicy = useDownloadPolicy();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDownload = (format: DownloadFormat) => {
    downloadPolicy.mutate({ policyId, format });
  };

  const handleQuickDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDownload(defaultFormat);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(true);
  };

  if (variant === 'icon') {
    return (
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className={`${styles.iconButton} ${className || ''}`}
            disabled={downloadPolicy.isPending}
            onClick={handleQuickDownload}
            onContextMenu={handleContextMenu}
            title={`Download ${policyTitle} as ${formatDetails[defaultFormat].name}`}
          >
            {downloadPolicy.isPending ? (
              <Loader2 size={16} className={styles.spinner} />
            ) : (
              <Download size={16} />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={styles.content}>
          <DropdownMenuLabel>Download "{policyTitle}"</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(['pdf', 'docx', 'md'] as DownloadFormat[]).map((format) => {
            const { icon: Icon, name, description } = formatDetails[format];
            return (
              <DropdownMenuItem
                key={format}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(format);
                  setIsDropdownOpen(false);
                }}
                disabled={downloadPolicy.isPending}
                className={styles.menuItem}
              >
                <Icon size={18} className={styles.icon} />
                <div className={styles.itemDetails}>
                  <span className={styles.itemName}>{name}</span>
                  <span className={styles.itemDescription}>{description}</span>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={className}
          disabled={downloadPolicy.isPending}
        >
          {downloadPolicy.isPending ? (
            <Loader2 size={16} className={styles.spinner} />
          ) : (
            <Download size={16} />
          )}
          {downloadPolicy.isPending ? 'Downloading...' : 'Download'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={styles.content}>
        <DropdownMenuLabel>Download "{policyTitle}"</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(['pdf', 'docx', 'md'] as DownloadFormat[]).map((format) => {
          const { icon: Icon, name, description } = formatDetails[format];
          return (
            <DropdownMenuItem
              key={format}
              onClick={() => handleDownload(format)}
              disabled={downloadPolicy.isPending}
              className={styles.menuItem}
            >
              <Icon size={18} className={styles.icon} />
              <div className={styles.itemDetails}>
                <span className={styles.itemName}>{name}</span>
                <span className={styles.itemDescription}>{description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};