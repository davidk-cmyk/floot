import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { postSuggestMissingPolicies, Suggestion } from '../endpoints/ai/suggest-missing-policies_POST.schema';
import { toast } from 'sonner';

async function streamReader(stream: ReadableStream<string>): Promise<string> {
  const reader = stream.getReader();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result += value;
  }
  return result;
}

export const usePolicySuggestions = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const stream = await postSuggestMissingPolicies();
      const jsonString = await streamReader(stream);
      try {
        const parsedSuggestions = JSON.parse(jsonString);
        
        // Handle both direct array and object with policies key for robustness
        let suggestionsArray;
        if (Array.isArray(parsedSuggestions)) {
          suggestionsArray = parsedSuggestions;
        } else if (parsedSuggestions && typeof parsedSuggestions === 'object' && Array.isArray(parsedSuggestions.policies)) {
          suggestionsArray = parsedSuggestions.policies;
        } else {
          throw new Error("AI response was not an array or object with policies array.");
        }
        
        // Filter out malformed suggestions - keep only those with required fields
        const validSuggestions = suggestionsArray.filter((s: any) => 
          s && 
          typeof s === 'object' && 
          typeof s.title === 'string' && 
          s.title.trim() && 
          typeof s.description === 'string' && 
          s.description.trim() && 
          typeof s.category === 'string' && 
          s.category.trim()
        );
        
        if (validSuggestions.length >= 3) {
          // Limit to maximum of 8 suggestions to prevent page unresponsiveness
          const limitedSuggestions = validSuggestions.slice(0, 8);
          
          // Truncate descriptions to prevent excessive DOM rendering
          const processedSuggestions = limitedSuggestions.map((suggestion: any) => ({
            ...suggestion,
            description: suggestion.description.length > 250 
              ? suggestion.description.substring(0, 247) + '...'
              : suggestion.description
          }));
          
          console.log(`Found ${validSuggestions.length} valid suggestions out of ${suggestionsArray.length} total, limited to ${processedSuggestions.length} with truncated descriptions`);
          return processedSuggestions as Suggestion[];
        }
        
        console.warn(`Only ${validSuggestions.length} valid suggestions found out of ${suggestionsArray.length} total. Need at least 3.`);
        throw new Error(`Only ${validSuggestions.length} valid suggestions found. Need at least 3 for useful results.`);
      } catch (e) {
        if (e instanceof Error && e.message.includes('valid suggestions found')) {
          throw e; // Re-throw our custom error about insufficient valid suggestions
        }
        console.error("Failed to parse AI suggestions JSON:", e, "Received string:", jsonString);
        throw new Error("Could not understand the suggestion format from the AI.");
      }
    },
    onSuccess: (data) => {
      setSuggestions(data);
      setError(null);
    },
    onError: (err: Error) => {
      const errorMessage = err.message || 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`Failed to generate suggestions: ${errorMessage}`);
      setSuggestions(null);
    },
  });

  const generateSuggestions = useCallback(() => {
    // Reset state before starting a new request
    setSuggestions(null);
    setError(null);
    mutation.mutate();
  }, [mutation]);

  return {
    suggestions,
    generateSuggestions,
    isGenerating: mutation.isPending,
    error,
  };
};