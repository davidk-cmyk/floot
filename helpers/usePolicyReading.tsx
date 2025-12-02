import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  postStartReading,
  InputType as StartReadingInputType,
  OutputType as StartReadingOutputType,
} from "../endpoints/policies/reading/start_POST.schema";
import {
  postUpdateReading,
  InputType as UpdateReadingInputType,
} from "../endpoints/policies/reading/update_POST.schema";
import { toast } from "sonner";

/**
 * A mutation to start a new policy reading session.
 * Returns the new session details on success.
 */
export const useStartReadingSession = () => {
  return useMutation<StartReadingOutputType, Error, StartReadingInputType>({
    mutationFn: postStartReading,
    onSuccess: () => {
      console.log("Policy reading session started.");
    },
    onError: (error) => {
      toast.error(`Could not start reading session: ${error.message}`);
    },
  });
};

/**
 * A mutation to update an ongoing policy reading session.
 */
export const useUpdateReadingSession = () => {
  return useMutation<unknown, Error, UpdateReadingInputType>({
    mutationFn: postUpdateReading,
    onSuccess: () => {
      console.log("Policy reading progress updated.");
    },
    onError: (error) => {
      // Avoid showing toasts for every update error to prevent spamming the user.
      // Log to console for debugging.
      console.error("Failed to update reading session:", error.message);
    },
  });
};