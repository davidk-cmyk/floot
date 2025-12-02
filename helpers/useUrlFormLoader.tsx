import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { marked } from 'marked';
import { toast } from 'sonner';
import { UniversalPolicyFormValues } from './universalPolicyFormSchema';

interface UseUrlFormLoaderProps {
  setFormValues: (updater: (prev: UniversalPolicyFormValues) => UniversalPolicyFormValues) => void;
  setActiveTab: (tab: 'ai' | 'upload' | 'manual') => void;
}

/**
 * A hook to process URL search parameters and pre-fill a form.
 * It runs only once on mount and cleans up the URL parameters after processing.
 *
 * @param {UseUrlFormLoaderProps} props Callbacks to update form state and active tab.
 * @returns {{ hasProcessed: boolean }} A boolean indicating if the URL parameters have been processed.
 */
export function useUrlFormLoader({ setFormValues, setActiveTab }: UseUrlFormLoaderProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) {
      return;
    }

    const title = searchParams.get('title');
    const content = searchParams.get('content');
    const category = searchParams.get('category');
    const department = searchParams.get('department');
    const switchToAI = searchParams.get('switchToAI') === 'true';
    const fromSuggestion = searchParams.get('fromSuggestion') === 'true';

    const hasUrlParams = !!(title || content || category || department);

    if (hasUrlParams) {
      processedRef.current = true;

      const processParams = async () => {
        try {
          if (switchToAI) {
            setActiveTab('ai');
            if (fromSuggestion) {
              toast.success('Suggestion loaded into AI Generator', {
                description: 'Review the pre-filled fields and generate your policy.',
              });
            }
          } else {
            let htmlContent = content || '';
            if (content) {
              // Assuming content might be markdown
              htmlContent = await marked(content);
            }

            setFormValues((prev) => ({
              ...prev,
              title: title || prev.title,
              content: typeof htmlContent === 'string' ? htmlContent : (content || prev.content),
              category: category || prev.category,
              department: department || prev.department,
            }));
            setActiveTab('manual');
          }

          // Clean up URL parameters after processing
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('title');
          newSearchParams.delete('content');
          newSearchParams.delete('category');
          newSearchParams.delete('department');
          newSearchParams.delete('switchToAI');
          newSearchParams.delete('fromSuggestion');
          setSearchParams(newSearchParams, { replace: true });

        } catch (error) {
          console.error('Failed to process URL parameters:', error);
          toast.error('Failed to load suggested content from URL.');
        }
      };

      processParams();
    } else {
      // Mark as processed even if there are no params to handle
      processedRef.current = true;
    }
  }, [searchParams, setSearchParams, setFormValues, setActiveTab]);

  return { hasProcessed: processedRef.current };
}