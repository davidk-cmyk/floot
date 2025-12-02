import React, { useMemo } from 'react';
import { PolicyReadingTracker } from './PolicyReadingTracker';
import { PolicyWithAuthor } from '../endpoints/policies/get_POST.schema';
import styles from './PolicyContent.module.css';

interface PolicyContentProps {
  policy: PolicyWithAuthor;
  contentContainerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const processContent = (htmlContent: string) => {
  if (!htmlContent) return '';
  const usedIds = new Map<string, number>();

  return htmlContent.replace(/<h([1-6])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, innerContent) => {
    // If id already exists, don't touch it
    if (attrs.includes('id=')) {
      return match;
    }

    const plainText = innerContent.replace(/<[^>]+>/g, '');
    const baseId = slugify(plainText);

    if (!baseId) return match;

    let id = baseId;
    const count = usedIds.get(baseId) || 0;
    if (count > 0) {
      id = `${baseId}-${count}`;
    }
    usedIds.set(baseId, count + 1);

    return `<h${level}${attrs} id="${id}">${innerContent}</h${level}>`;
  });
};

export const PolicyContent: React.FC<PolicyContentProps> = ({ policy, contentContainerRef, className }) => {
  const processedContent = useMemo(() => processContent(policy.content), [policy.content]);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {policy.requiresAcknowledgmentFromPortals && (
        <PolicyReadingTracker policyId={policy.id} contentContainerRef={contentContainerRef} />
      )}
      <div
        className={styles.contentBody}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </div>
  );
};