import React, { useState } from 'react';
import { useEmailAcknowledgmentStats, useEmailAcknowledgmentReport } from '../helpers/useEmailAcknowledgmentApi';
import { usePortals } from '../helpers/usePortalApi';
import { StatCard } from './StatCard';
import { Input } from './Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Button } from './Button';
import { Badge } from './Badge';
import { Skeleton } from './Skeleton';
import { CheckCircle, FileDown, Search, Mail, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDebounce } from '../helpers/useDebounce';
import styles from './AcknowledgementDashboard.module.css';

const DEBOUNCE_DELAY = 300;

export const AcknowledgementDashboard: React.FC<{ className?: string }> = ({ className }) => {
  const [filters, setFilters] = useState({
    portalId: undefined as number | undefined,
    status: 'all' as 'all' | 'acknowledged' | 'pending',
    department: '',
    page: 1,
    limit: 25,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, DEBOUNCE_DELAY);

  const { data: stats, isFetching: isStatsLoading } = useEmailAcknowledgmentStats();
  const { data: portalsData } = usePortals({ page: 1, limit: 100 });
  const { data: reportData, isFetching: isReportLoading } = useEmailAcknowledgmentReport({
    portalId: filters.portalId,
    status: filters.status === 'all' ? undefined : filters.status,
    department: debouncedSearch || undefined,
    page: filters.page,
    limit: filters.limit,
  });

  const portals = portalsData?.portals ?? [];
  const records = reportData?.records ?? [];
  const pagination = reportData?.pagination;

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const { getEmailAcknowledgmentReport } = await import('../endpoints/email-acknowledgment/report_GET.schema');
      const BATCH_LIMIT = 100;
      const commonParams = {
        portalId: filters.portalId,
        status: filters.status === 'all' ? undefined : filters.status,
        department: debouncedSearch || undefined,
      };

      // 1. Fetch first page to get total count
      const firstPageData = await getEmailAcknowledgmentReport({
        ...commonParams,
        page: 1,
        limit: BATCH_LIMIT,
      });

      let allRecords = [...firstPageData.records];
      const totalPages = Math.ceil(firstPageData.pagination.total / BATCH_LIMIT);

      // 2. Fetch remaining pages if any
      if (totalPages > 1) {
        const remainingPagePromises = [];
        for (let i = 2; i <= totalPages; i++) {
          remainingPagePromises.push(
            getEmailAcknowledgmentReport({
              ...commonParams,
              page: i,
              limit: BATCH_LIMIT,
            })
          );
        }

        const remainingPagesData = await Promise.all(remainingPagePromises);
        remainingPagesData.forEach(pageData => {
          allRecords = [...allRecords, ...pageData.records];
        });
      }

      // Convert to CSV
      const headers = ['Email', 'Policy Title', 'Portal Name', 'Department', 'Status', 'Acknowledged At'];
      const csvRows = [
        headers.join(','),
        ...allRecords.map(record => [
          `"${record.email}"`,
          `"${record.policyTitle}"`,
          `"${record.portalName}"`,
          `"${record.department || 'N/A'}"`,
          record.status,
          record.acknowledgedAt ? new Date(record.acknowledgedAt).toLocaleDateString() : 'N/A',
        ].join(','))
      ];

      // Download CSV
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-acknowledgments-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderTableRow = (record: typeof records[0]) => {
    return (
      <tr key={`${record.email}-${record.policyTitle}`} className={styles.tableRow}>
        <td className={styles.emailCell}>
          <Mail size={16} className={styles.emailIcon} />
          {record.email}
        </td>
        <td className={styles.policyCell}>
          <span className={styles.policyTitle}>{record.policyTitle}</span>
        </td>
        <td className={styles.portalCell}>{record.portalName}</td>
        <td className={styles.departmentCell}>{record.department || 'N/A'}</td>
        <td className={styles.statusCell}>
          {record.status === 'acknowledged' ? (
            <Badge variant="success">Acknowledged</Badge>
          ) : (
            <Badge variant="secondary">Pending</Badge>
          )}
        </td>
        <td className={styles.dateCell}>
          {record.acknowledgedAt ? new Date(record.acknowledgedAt).toLocaleDateString() : '-'}
        </td>
      </tr>
    );
  };

  return (
    <div className={`${styles.dashboardContainer} ${className || ''}`}>
      <header className={styles.header}>
        <h1>Email-Based Acknowledgement Dashboard</h1>
        <p>Track policy acknowledgements from email recipients across all portals.</p>
      </header>

      <div className={styles.statsGrid}>
        <StatCard
          title="Total Portals"
          value={stats?.totalPortalsWithEmailTracking ?? 0}
          icon={<FileText size={24} />}
          isLoading={isStatsLoading}
        />
        <StatCard
          title="Expected Acknowledgments"
          value={stats?.totalExpectedAcknowledgments ?? 0}
          icon={<Mail size={24} />}
          isLoading={isStatsLoading}
        />
        <StatCard
          title="Total Acknowledged"
          value={stats?.totalAcknowledged ?? 0}
          icon={<CheckCircle size={24} />}
          isLoading={isStatsLoading}
        />
        <StatCard
          title="Acknowledgment Rate"
          value={`${stats?.acknowledgmentRate.toFixed(1) ?? 0}%`}
          icon={<TrendingUp size={24} />}
          isLoading={isStatsLoading}
        />
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <Input
              placeholder="Search by department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.selectFilters}>
            <Select 
              value={filters.portalId?.toString() ?? 'all'} 
              onValueChange={(v) => handleFilterChange('portalId', v === 'all' ? undefined : parseInt(v))}
            >
              <SelectTrigger><SelectValue placeholder="All Portals" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Portals</SelectItem>
                {portals.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select 
              value={filters.status} 
              onValueChange={(v) => handleFilterChange('status', v as typeof filters.status)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className={styles.actions}>
            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={isExporting}
            >
              <FileDown size={16} />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Policy Title</th>
                <th>Portal</th>
                <th>Department</th>
                <th>Status</th>
                <th>Acknowledged At</th>
              </tr>
            </thead>
            <tbody>
              {isReportLoading && !reportData ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className={styles.tableRow}>
                    <td><Skeleton className={styles.cellSkeleton} /></td>
                    <td><Skeleton className={styles.cellSkeleton} /></td>
                    <td><Skeleton className={styles.cellSkeleton} /></td>
                    <td><Skeleton className={styles.cellSkeleton} /></td>
                    <td><Skeleton className={styles.cellSkeleton} /></td>
                    <td><Skeleton className={styles.cellSkeleton} /></td>
                  </tr>
                ))
              ) : records.length > 0 ? (
                records.map(renderTableRow)
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    <Mail size={48} className={styles.emptyIcon} />
                    <h3>No acknowledgment records found</h3>
                    <p>Try adjusting your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};