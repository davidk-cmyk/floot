import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  postSuggestTaxonomies,
  InputType as SuggestTaxonomiesInput,
} from "../endpoints/ai/suggest-taxonomies_POST.schema";

/**
 * A React Query hook for the AI-powered taxonomy suggestion feature.
 *
 * This hook provides a mutation function to call the `suggest-taxonomies` endpoint.
 * It handles loading states, success notifications, and error handling.
 *
 * @example
 * const { mutate: suggest, isPending } = useSuggestTaxonomies({
 *   onSuccess: (data) => {
 *     // Update form state with suggested taxonomies
 *     setValue('categories', data.categories);
 *     setValue('departments', data.departments);
 *     setValue('tags', data.tags);
 *   }
 * });
 *
 * const handleSuggestClick = () => {
 *   const topic = getValues('topic');
 *   if (topic) {
 *     suggest({ topic });
 *   }
 * };
 */
export const useSuggestTaxonomies = (options?: {
  onSuccess?: (data: Awaited<ReturnType<typeof postSuggestTaxonomies>>) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (data: SuggestTaxonomiesInput) => postSuggestTaxonomies(data),
    onSuccess: (data) => {
      toast.success("AI suggestions loaded!");
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      console.error("Failed to get AI suggestions:", error);
      toast.error(`Failed to get suggestions: ${error.message}`);
      options?.onError?.(error);
    },
  });
};