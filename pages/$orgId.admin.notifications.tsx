import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useAdvancedNotificationsList, useBulkMarkAsRead } from "../helpers/useNotifications";
import { NotificationFilters } from "../components/NotificationFilters";
import { NotificationSearch } from "../components/NotificationSearch";
import { NotificationsList } from "../components/NotificationsList";
import { NotificationActions } from "../components/NotificationActions";
import { NotificationSort } from "../components/NotificationSort";
import { InputType as ListInputType } from "../endpoints/notifications/list_GET.schema";
import styles from "./notifications.module.css";

const NotificationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const params: ListInputType = useMemo(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = (searchParams.get("status") as ListInputType["status"]) || "all";
    const search = searchParams.get("search") || undefined;
    const sortBy = (searchParams.get("sortBy") as ListInputType["sortBy"]) || "date";
    const sortOrder = (searchParams.get("sortOrder") as ListInputType["sortOrder"]) || "desc";
    const types = searchParams.getAll("types") || undefined;
    const priority = (searchParams.get("priority") as ListInputType["priority"]) || undefined;
    const dateRange = (searchParams.get("dateRange") as ListInputType["dateRange"]) || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    return {
      page,
      limit,
      status,
      search,
      sortBy,
      sortOrder,
      types: types.length > 0 ? types : undefined,
      priority,
      dateRange,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
  }, [searchParams]);

  const { data, isFetching, error } = useAdvancedNotificationsList(params, {
    pollingEnabled: true,
    pollingInterval: 60000,
  });
  const bulkMarkAsReadMutation = useBulkMarkAsRead();

  const handleFilterChange = (newFilters: Record<string, string | string[] | undefined>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || (Array.isArray(value) && value.length === 0)) {
        newSearchParams.delete(key);
      } else if (Array.isArray(value)) {
        newSearchParams.delete(key);
        value.forEach(v => newSearchParams.append(key, v));
      } else {
        newSearchParams.set(key, value);
      }
    });
    newSearchParams.set("page", "1"); // Reset to first page on filter change
    setSearchParams(newSearchParams);
    setSelectedIds(new Set());
  };

  const handlePageChange = (newPage: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("page", newPage.toString());
    setSearchParams(newSearchParams);
    window.scrollTo(0, 0);
  };

  const totalNotifications = data?.total ?? 0;
  const notifications = data?.notifications ?? [];

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedIds(new Set(notifications.map(n => n.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, isChecked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleBulkAction = async (action: string, ids: number[]) => {
    if (action === 'markAsRead' && ids.length > 0) {
      try {
        await bulkMarkAsReadMutation.mutateAsync({ notificationIds: ids });
        setSelectedIds(new Set());
      } catch (error) {
        console.error('Failed to mark notifications as read:', error);
      }
    }
  };

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setSelectedIds(new Set());
    }
  };

  return (
    <>
      <Helmet>
        <title>Notifications | MyPolicyPortal</title>
        <meta name="description" content="Manage and view all your notifications." />
      </Helmet>
      <div className={styles.container} onKeyDown={handleKeyDown} tabIndex={-1}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Notifications</h1>
            <p className={styles.description}>
              View and manage all your notifications in one place.
            </p>
          </div>
        </header>

        <div className={styles.controls}>
          <NotificationSearch
            initialValue={params.search}
            onSearch={(query) => handleFilterChange({ search: query })}
          />
          <div className={styles.actionsAndSort}>
            <NotificationFilters
              currentFilters={params}
              onFilterChange={handleFilterChange}
            />
            <NotificationSort
              sortBy={params.sortBy ?? 'date'}
              sortOrder={params.sortOrder ?? 'desc'}
              onSortChange={(sortBy, sortOrder) => handleFilterChange({ sortBy, sortOrder })}
            />
          </div>
        </div>

        <div className={styles.content}>
          <NotificationActions
            selectedIds={Array.from(selectedIds)}
            onActionComplete={() => setSelectedIds(new Set())}
            onBulkAction={handleBulkAction}
            isLoading={bulkMarkAsReadMutation.isPending}
          />
          <NotificationsList
            notifications={notifications}
            isLoading={isFetching}
            error={error}
            pagination={{
              currentPage: params.page ?? 1,
              totalPages: data?.totalPages ?? 1,
              totalItems: totalNotifications,
              onPageChange: handlePageChange,
            }}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
          />
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;