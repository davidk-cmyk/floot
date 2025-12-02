import React, { useMemo } from 'react';
import { Download, Share2, Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './Button';
import { useDownloadPolicy } from '../helpers/usePolicyDownloadApi';
import styles from './PolicyActionsPanel.module.css';

interface PolicyActionsPanelProps {
  policyId: number;
  policyTitle: string;
  policyContent: string;
  portalSlug: string;
  onPrint?: () => void;
  className?: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export const PolicyActionsPanel: React.FC<PolicyActionsPanelProps> = ({
  policyId,
  policyTitle,
  policyContent,
  portalSlug,
  onPrint,
  className,
}) => {
  const downloadPolicy = useDownloadPolicy();

  // Extract headings for Table of Contents
  const tocItems = useMemo(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(policyContent, 'text/html');
      const headings = doc.querySelectorAll('h2, h3');
      
      return Array.from(headings).map((heading) => {
        const text = heading.textContent || '';
        // Generate ID: lowercase, replace spaces/special chars with hyphens
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
          
        return {
          id,
          text,
          level: parseInt(heading.tagName.substring(1), 10),
        };
      });
    } catch (e) {
      console.error('Failed to parse policy content for TOC', e);
      return [];
    }
  }, [policyContent]);

  const handleDownloadPdf = () => {
    downloadPolicy.mutate({ 
      policyId, 
      format: 'pdf' 
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const scrollToHeading = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      // Update URL hash without scrolling again
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <div className={`${styles.panel} ${className || ''}`}>
      {/* Actions Section */}
      <div className={styles.actionsSection}>
        <Button 
          className={styles.downloadButton}
          onClick={handleDownloadPdf}
          disabled={downloadPolicy.isPending}
        >
          {downloadPolicy.isPending ? (
            <Loader2 size={18} className={styles.spinner} />
          ) : (
            <Download size={18} />
          )}
          Download PDF
        </Button>

        <Button 
          variant="outline" 
          className={styles.actionButton}
          onClick={handleShare}
        >
          <Share2 size={18} />
          Share Policy
        </Button>

        <Button 
          variant="outline" 
          className={styles.actionButton}
          onClick={handlePrint}
        >
          <Printer size={18} />
          Print View
        </Button>
      </div>

      {/* Table of Contents Section */}
      {tocItems.length > 0 && (
        <div className={styles.tocSection}>
          <h3 className={styles.tocHeader}>On this page</h3>
          <nav className={styles.tocNav}>
            <ul className={styles.tocList}>
              {tocItems.map((item, index) => (
                <li 
                  key={`${item.id}-${index}`} 
                  className={`${styles.tocItem} ${item.level === 3 ? styles.tocItemH3 : ''}`}
                >
                  <a 
                    href={`#${item.id}`}
                    onClick={(e) => scrollToHeading(e, item.id)}
                    className={styles.tocLink}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};