import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import {
  getEmailAcknowledgmentStats,
  OutputType as StatsOutputType,
} from "../endpoints/email-acknowledgment/stats_GET.schema";
import {
  getEmailAcknowledgmentReport,
  InputType as ReportInputType,
  OutputType as ReportOutputType,
} from "../endpoints/email-acknowledgment/report_GET.schema";
import {
  getPendingEmailAcknowledgments,
  OutputType as PendingOutputType,
} from "../endpoints/email-acknowledgment/pending_GET.schema";
import {
  postRequestAcknowledgmentCode,
  InputType as RequestCodeInputType,
  OutputType as RequestCodeOutputType,
} from "../endpoints/portal/request-acknowledgment-code_POST.schema";
import {
  postConfirmAcknowledgment,
  InputType as ConfirmAcknowledgmentInputType,
  OutputType as ConfirmAcknowledgmentOutputType,
} from "../endpoints/portal/confirm-acknowledgment_POST.schema";
import {
  postCheckAcknowledgment,
  InputType as CheckAcknowledgmentInputType,
  OutputType as CheckAcknowledgmentOutputType,
} from "../endpoints/portal/check-acknowledgment_POST.schema";
import { toast } from "sonner";

// --- Query Keys ---

const emailAcknowledgmentKeys = {
  all: ["emailAcknowledgment"] as const,
  stats: () => [...emailAcknowledgmentKeys.all, "stats"] as const,
  reports: () => [...emailAcknowledgmentKeys.all, "report"] as const,
  report: (filters: ReportInputType) => [...emailAcknowledgmentKeys.reports(), filters] as const,
  pending: () => [...emailAcknowledgmentKeys.all, "pending"] as const,
  check: (portalSlug: string, policyId: number, email: string) => 
    [...emailAcknowledgmentKeys.all, "check", portalSlug, policyId, email] as const,
};

// --- Hooks ---

/**
 * React Query hook for fetching email acknowledgment statistics.
 * @returns A query object with the acknowledgment stats data.
 */
export const useEmailAcknowledgmentStats = (): UseQueryResult<StatsOutputType, Error> => {
  return useQuery({
    queryKey: emailAcknowledgmentKeys.stats(),
    queryFn: () => getEmailAcknowledgmentStats(),
  });
};

/**
 * React Query hook for fetching a paginated report of email acknowledgments.
 * @param filters - Filtering and pagination options (portalId, status, department, page, limit).
 * @returns A query object with the report records and pagination info.
 */
export const useEmailAcknowledgmentReport = (filters: ReportInputType): UseQueryResult<ReportOutputType, Error> => {
  return useQuery({
    queryKey: emailAcknowledgmentKeys.report(filters),
    queryFn: () => getEmailAcknowledgmentReport(filters),
    placeholderData: (previousData) => previousData,
  });
};

/**
 * React Query hook for fetching all pending email acknowledgments.
 * @returns A query object with a list of pending acknowledgments.
 */
export const useEmailAcknowledgmentPending = (): UseQueryResult<PendingOutputType, Error> => {
  return useQuery({
    queryKey: emailAcknowledgmentKeys.pending(),
    queryFn: () => getPendingEmailAcknowledgments(),
  });
};

/**
 * Placeholder for the send reminders endpoint schema.
 * This will be replaced when endpoints/policies/reminders/send_POST is implemented.
 */
type SendRemindersInput = {
  reminders: {
    email: string;
    policyId: number;
    portalId: number;
  }[];
};

// Placeholder function until the actual endpoint helper is available.
const postSendReminders = async (body: SendRemindersInput): Promise<{ success: boolean; message: string }> => {
  // This is a placeholder. The actual implementation will call the generated helper
  // from endpoints/policies/reminders/send_POST.schema.ts
  console.log("Sending reminders (placeholder):", body);
  // Simulate an API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  // In a real scenario, this would be:
  // return await postSendPolicyReminders(body);
  return { success: true, message: `${body.reminders.length} reminders sent successfully.` };
};

/**
 * React Query mutation for sending email reminders for pending acknowledgments.
 * @returns A mutation object for sending reminders.
 */
export const useSendEmailReminders = (): UseMutationResult<
  { success: boolean; message: string },
  Error,
  SendRemindersInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postSendReminders,
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalidate queries that might be affected by sending reminders,
      // e.g., if the report includes a 'last reminder sent' date.
      queryClient.invalidateQueries({ queryKey: emailAcknowledgmentKeys.reports() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to send reminders.");
      console.error("Error sending reminders:", error);
    },
  });
};

/**
 * React Query mutation for requesting an acknowledgment confirmation code.
 * Sends a 6-digit code to the user's email for verification.
 * @returns A mutation object for requesting the confirmation code.
 */
export const useRequestAcknowledgmentCode = (): UseMutationResult<
  RequestCodeOutputType,
  Error,
  RequestCodeInputType
> => {
  return useMutation({
    mutationFn: postRequestAcknowledgmentCode,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to request confirmation code.");
      console.error("Error requesting acknowledgment code:", error);
    },
  });
};

/**
 * React Query hook for checking if an email has already acknowledged a specific policy.
 * This is used for anonymous visitors on password-protected portals.
 * @param portalSlug - The portal slug
 * @param policyId - The policy ID
 * @param email - The visitor's email address (query is disabled if not provided)
 * @returns A query object with acknowledgment status
 */
export const useCheckEmailAcknowledgment = (
  portalSlug: string,
  policyId: number,
  email: string | undefined
): UseQueryResult<CheckAcknowledgmentOutputType, Error> => {
  return useQuery({
    queryKey: email ? emailAcknowledgmentKeys.check(portalSlug, policyId, email) : ["disabled"],
    queryFn: () => {
      if (!email) {
        throw new Error("Email is required to check acknowledgment");
      }
      return postCheckAcknowledgment({ portalSlug, policyId, email });
    },
    enabled: !!email && !!portalSlug && !!policyId,
  });
};

/**
 * React Query mutation for confirming an acknowledgment with a verification code.
 * Validates the code and records the acknowledgment.
 * @returns A mutation object for confirming the acknowledgment.
 */
export const useConfirmAcknowledgment = (): UseMutationResult<
  ConfirmAcknowledgmentOutputType,
  Error,
  ConfirmAcknowledgmentInputType
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postConfirmAcknowledgment,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        // Invalidate all acknowledgment queries to reflect the new confirmation.
        queryClient.invalidateQueries({ queryKey: emailAcknowledgmentKeys.all });
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to confirm acknowledgment.");
      console.error("Error confirming acknowledgment:", error);
    },
  });
};