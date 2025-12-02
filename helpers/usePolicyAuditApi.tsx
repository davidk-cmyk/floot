import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getPolicyAudit,
  InputType as PolicyAuditInput,
} from "../endpoints/policies/audit_GET.schema";
import {
  postPolicyAuditExport,
  InputType as PolicyAuditExportInput,
} from "../endpoints/policies/audit/export_POST.schema";

export const POLICY_AUDIT_QUERY_KEY = "policyAudit";

/**
 * Hook to fetch policy audit logs with filtering, sorting, and pagination.
 * @param filters The filters, sorting, and pagination options.
 */
export const usePolicyAudit = (filters: PolicyAuditInput) => {
  return useQuery({
    queryKey: [POLICY_AUDIT_QUERY_KEY, filters],
    queryFn: () => getPolicyAudit(filters),
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook to export policy audit logs as a CSV file.
 * Returns a mutation that calls the export endpoint and returns the raw Response object.
 * The caller should handle the Response to trigger a file download.
 */
export const useExportPolicyAudit = () => {
  return useMutation({
    mutationFn: (filters: PolicyAuditExportInput) =>
      postPolicyAuditExport(filters),
  });
};