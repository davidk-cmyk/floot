import { useState, useCallback } from 'react';
import { marked } from 'marked';
import { UniversalPolicyFormValues } from './universalPolicyFormSchema';

type TabValue = 'ai' | 'upload' | 'manual';

interface UsePolicyFormTabsProps {
  setFormValues: (updater: (prev: UniversalPolicyFormValues) => UniversalPolicyFormValues) => void;
}

/**
 * A hook to manage the state and logic for the policy creation form tabs.
 *
 * @param {UsePolicyFormTabsProps} props Callbacks to update form state.
 * @returns An object with tab state and handlers for tab-related actions.
 */
export function usePolicyFormTabs({ setFormValues }: UsePolicyFormTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('ai');

  const handlePolicyGenerated = useCallback(async (
    content: string,
    metadata?: Partial<UniversalPolicyFormValues>,
    switchToManual?: boolean
  ) => {
    const htmlContent = await marked(content);
    const firstLine = content.split('\n')[0];
    const title = firstLine.replace(/^#+\s*/, '').trim();

    setFormValues((prev) => ({
      ...prev,
      title: title || 'Generated Policy',
      content: typeof htmlContent === 'string' ? htmlContent : content,
      ...metadata,
    }));

    if (switchToManual) {
      setActiveTab('manual');
    }
  }, [setFormValues]);

  const handleFileContentExtracted = useCallback((title: string, content: string) => {
    setFormValues((prev) => ({
      ...prev,
      title,
      content,
    }));
    setActiveTab('manual');
  }, [setFormValues]);

  return {
    activeTab,
    setActiveTab,
    handlePolicyGenerated,
    handleFileContentExtracted,
  };
}