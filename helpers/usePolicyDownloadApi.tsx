import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  postDownloadPolicy,
  InputType as DownloadPolicyInput,
} from "../endpoints/policies/download_POST.schema";
import {
  postBulkDownloadPolicies,
  InputType as BulkDownloadPoliciesInput,
} from "../endpoints/policies/download/bulk_POST.schema";
import {
  getGetDownloadSettings,
} from "../endpoints/policies/download/settings_GET.schema";
import {
  postUpdateDownloadSettings,
  InputType as UpdateDownloadSettingsInput,
} from "../endpoints/policies/download/settings_POST.schema";
import { useOrganization } from "./useOrganization";

export const DOWNLOAD_SETTINGS_QUERY_KEY = ["downloadSettings"];

/**
 * A helper function to trigger a file download in the browser from a base64 string.
 * Uses data URI approach to work in sandboxed iframe environments.
 * @param data The base64 encoded file content.
 * @param mimeType The MIME type of the file.
 * @param filename The desired filename for the download.
 */
const triggerDownload = (data: string, mimeType: string, filename: string) => {
  try {
    const dataUri = `data:${mimeType};base64,${data}`;
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = dataUri;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error("Failed to trigger download:", error);
    toast.error("Could not initiate file download. Please try again.");
  }
};

/**
 * Fetches the download settings for the current organization.
 */
export const useDownloadSettings = () => {
  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;

  return useQuery({
    queryKey: [...DOWNLOAD_SETTINGS_QUERY_KEY, { organizationId }],
    queryFn: () => getGetDownloadSettings(),
    enabled: organizationState.type === 'active',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * A mutation hook for updating the organization's download settings.
 * Restricted to admin users (enforced by the endpoint).
 */
export const useUpdateDownloadSettings = () => {
  const queryClient = useQueryClient();
  const { organizationState } = useOrganization();
  const organizationId = organizationState.type === 'active' ? organizationState.currentOrganization.id : null;

  return useMutation({
    mutationFn: (settings: UpdateDownloadSettingsInput) =>
      postUpdateDownloadSettings(settings),
    onSuccess: () => {
      toast.success("Download settings updated successfully!");
      queryClient.invalidateQueries({ queryKey: [...DOWNLOAD_SETTINGS_QUERY_KEY, { organizationId }] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to update settings: ${message}`);
    },
  });
};

/**
 * A mutation hook to download a single policy file.
 */
export const useDownloadPolicy = () => {
  return useMutation({
    mutationFn: (input: DownloadPolicyInput) => {
      const promise = postDownloadPolicy(input);
      toast.promise(promise, {
        loading: `Preparing your download...`,
        success: "Download will begin shortly.",
        error: (err: Error) => `Download failed: ${err.message}`,
      });
      return promise;
    },
    onSuccess: (result) => {
      triggerDownload(result.data, result.mimeType, result.filename);
    },
    onError: (error: unknown) => {
      // The toast.promise handles the error display, this is for console logging
      console.error("Download policy error:", error);
    },
  });
};

/**
 * A mutation hook to download multiple policies as a single ZIP archive.
 */
export const useBulkDownloadPolicies = () => {
  return useMutation({
    mutationFn: (input: BulkDownloadPoliciesInput) => {
      const promise = postBulkDownloadPolicies(input);
      toast.promise(promise, {
        loading: `Generating ZIP archive for ${input.policyIds.length} policies...`,
        success: (data) => {
          if (data.processedCount < data.requestedCount) {
            return `Downloaded ${data.processedCount} of ${data.requestedCount} policies due to access restrictions. Your download will begin shortly.`;
          }
          return `Successfully prepared ${data.processedCount} policies. Your download will begin shortly.`;
        },
        error: (err: Error) => `Bulk download failed: ${err.message}`,
      });
      return promise;
    },
    onSuccess: (result) => {
      triggerDownload(result.data, result.mimeType, result.filename);
    },
    onError: (error: unknown) => {
      // The toast.promise handles the error display, this is for console logging
      console.error("Bulk download policies error:", error);
    },
  });
};