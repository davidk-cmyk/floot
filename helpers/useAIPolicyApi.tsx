import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  postGeneratePolicy,
  InputType as GeneratePolicyInput,
  OutputType as GeneratePolicyOutput,
} from "../endpoints/ai/generate-policy_POST.schema";
import {
  postRewritePlainEnglish,
  InputType as RewritePlainEnglishInput,
  OutputType as RewritePlainEnglishOutput,
} from "../endpoints/ai/rewrite-plain-english_POST.schema";
import {
  postSuggestImprovements,
  InputType as SuggestImprovementsInput,
  OutputType as SuggestImprovementsOutput,
} from "../endpoints/ai/suggest-improvements_POST.schema";

import {
  postPolicyPrompt,
  InputType as PolicyPromptInput,
  OutputType as PolicyPromptOutput,
} from "../endpoints/ai/policy-prompt_POST.schema";

/**
 * Hook to generate a new policy from a topic and other details.
 * The mutation returns a ReadableStream<string> on success, which can be
 * consumed by the UI to display the streaming response.
 */
export const useGeneratePolicy = () => {
  return useMutation<GeneratePolicyOutput, Error, GeneratePolicyInput>({
    mutationFn: (input: GeneratePolicyInput) => postGeneratePolicy(input),
    onSuccess: () => {
      toast.success("Policy generation started successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to start policy generation: ${error.message}`);
      console.error("Error in useGeneratePolicy:", error);
    },
  });
};

/**
 * Hook to rewrite policy text into plain English.
 * The mutation returns a ReadableStream<string> on success for streaming the
 * simplified text.
 */
export const useRewritePlainEnglish = () => {
  return useMutation<
    RewritePlainEnglishOutput,
    Error,
    RewritePlainEnglishInput
  >({
    mutationFn: (input: RewritePlainEnglishInput) =>
      postRewritePlainEnglish(input),
    onSuccess: () => {
      toast.success("Rewriting process started!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to start rewriting: ${error.message}`);
      console.error("Error in useRewritePlainEnglish:", error);
    },
  });
};

/**
 * Hook to get AI-powered suggestions for improving a policy.
 * The mutation returns a ReadableStream<string> on success, streaming the
 * suggestions as markdown.
 */
export const useSuggestImprovements = () => {
  return useMutation<
    SuggestImprovementsOutput,
    Error,
    SuggestImprovementsInput
  >({
    mutationFn: (input: SuggestImprovementsInput) =>
      postSuggestImprovements(input),
    onSuccess: () => {
      toast.success("Generating improvement suggestions...");
    },
    onError: (error: Error) => {
      toast.error(`Failed to get suggestions: ${error.message}`);
      console.error("Error in useSuggestImprovements:", error);
    },
  });
};

/**
 * Hook to send a custom prompt to the AI for policy editing.
 * The mutation returns a ReadableStream<string> on success, which can be
 * consumed by the UI to display the streaming response of the modified policy.
 */
export const usePolicyPrompt = () => {
  return useMutation<PolicyPromptOutput, Error, PolicyPromptInput>({
    mutationFn: (input: PolicyPromptInput) => postPolicyPrompt(input),
    onSuccess: () => {
      toast.success("AI is processing your request...");
    },
    onError: (error: Error) => {
      toast.error(`Failed to process prompt: ${error.message}`);
      console.error("Error in usePolicyPrompt:", error);
    },
  });
};