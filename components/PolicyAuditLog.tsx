import React, { useState } from "react";
import { usePolicyAudit, useExportPolicyAudit } from "../helpers/usePolicyAuditApi";
import { saveAs } from "file-saver";
import { InputType as PolicyAuditInput, AUDIT_LOG_ACTIONS } from "../endpoints/policies/audit_GET.schema";
import { formatAuditDetails } from "../helpers/auditDetailsFormatter";
import { useDebounce } from "../helpers/useDebounce";
import { DateRangePicker } from "./DateRangePicker";
import { Input } from "./Input";
import { Button } from "./Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Skeleton } from "./Skeleton";
import { Spinner } from "./Spinner";
import { AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import styles from "./PolicyAuditLog.module.css";

const DEBOUNCE_DELAY = 500;

export const PolicyAuditLog = () => {
  const [filters, setFilters] = useState<Omit<PolicyAuditInput, "page" | "limit" | "startDate" | "endDate">>({
    sortBy: "actionTimestamp",
    sortOrder: "desc",
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Debounce search inputs to prevent excessive API calls
  const debouncedPolicyName = useDebounce(filters.policyName, DEBOUNCE_DELAY);
  const debouncedUserName = useDebounce(filters.userName, DEBOUNCE_DELAY);

  const { data, isFetching, error } = usePolicyAudit({
    ...filters,
    policyName: debouncedPolicyName,
    userName: debouncedUserName,
    startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    page,
    limit,
  });

  const isFiltering = isFetching && data;

  const exportMutation = useExportPolicyAudit();

  const handleExportCSV = async () => {
    try {
      console.log("Starting CSV export with filters:", {
        policyName: debouncedPolicyName,
        action: filters.action,
        userName: debouncedUserName,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      const response = await exportMutation.mutateAsync({
        policyName: debouncedPolicyName,
        action: filters.action,
        userName: debouncedUserName,
        startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      // Extract filename from Content-Disposition header or use fallback
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `audit-log-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Convert response to blob and trigger download
      const blob = await response.blob();
      saveAs(blob, filename);
      
      console.log("CSV export completed successfully:", filename);
      toast.success("Audit log exported successfully");
    } catch (error) {
      console.error("Failed to export audit log:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to export audit log";
      toast.error(errorMessage);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };

  const renderTableBody = () => {
    if (isFetching && !data) {
      return Array.from({ length: limit }).map((_, i) => (
        <tr key={i}>
          <td><Skeleton style={{ height: '20px' }} /></td>
          <td><Skeleton style={{ height: '20px' }} /></td>
          <td><Skeleton style={{ height: '20px' }} /></td>
          <td><Skeleton style={{ height: '20px' }} /></td>
          <td><Skeleton style={{ height: '20px' }} /></td>
        </tr>
      ));
    }

    if (error) {
      return (
        <tr>
          <td colSpan={5} className={styles.errorState}>
            <AlertTriangle />
            <span>Error loading audit logs: {error.message}</span>
          </td>
        </tr>
      );
    }

    if (!data || data.logs.length === 0) {
      return (
        <tr>
          <td colSpan={5} className={styles.emptyState}>
            No audit logs found for the selected criteria.
          </td>
        </tr>
      );
    }

    return data.logs.map((log) => (
      <tr key={log.id}>
        <td>{log.policyName}</td>
        <td>
          <span className={styles.actionBadge}>{log.action}</span>
        </td>
        <td>{new Date(log.actionTimestamp).toLocaleString()}</td>
        <td>{log.user.displayName}</td>
        <td className={styles.detailsCell}>
          {log.details ? (
            <div className={styles.detailsContent}>
              {formatAuditDetails(log.details)}
            </div>
          ) : (
            "—"
          )}
        </td>
      </tr>
    ));
  };

  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Policy Audit Log</h1>
          {isFiltering && <Spinner size="sm" />}
        </div>
        <Button 
          variant="outline" 
          onClick={handleExportCSV}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? (
            <Spinner size="sm" />
          ) : (
            <Download size={16} />
          )}
          Export CSV
        </Button>
      </div>

      <div className={styles.filters}>
        <Input
          type="search"
          placeholder="Search by Policy Name..."
          onChange={(e) => handleFilterChange("policyName", e.target.value)}
        />
        <Select onValueChange={(v) => handleFilterChange("action", v === "__empty" ? undefined : v)}>
          <SelectTrigger><SelectValue placeholder="Filter by Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty">All Actions</SelectItem>
            {AUDIT_LOG_ACTIONS.map(action => (
              <SelectItem key={action} value={action}>
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="search"
          placeholder="Search by User..."
          onChange={(e) => handleFilterChange("userName", e.target.value)}
        />
        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          placeholder="Select date range"
        />
      </div>

      <div className={styles.tableContainer}>
        {isFiltering && <div className={styles.loadingOverlay} />}
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Policy Name</th>
              <th>Action</th>
              <th>Timestamp</th>
              <th>Performed By</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};