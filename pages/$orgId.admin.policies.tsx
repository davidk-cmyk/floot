import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { PlusCircle, FileText, Grid3X3, List } from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { useDebounce } from "../helpers/useDebounce";
import { usePolicies, useReviewPolicies } from "../helpers/usePolicyApi";
import { PolicyList } from "../components/PolicyList";
import { PolicyFilters } from "../components/PolicyFilters";
import { BulkPolicyDownload } from "../components/BulkPolicyDownload";
import { fromListEndpoint, fromReviewEndpoint } from "../helpers/policyCardData";
import { useOrgNavigation } from "../helpers/useOrgNavigation";

import { Button } from "../components/Button";
import { Link } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "../components/Pagination";

import { DashboardPageHeader } from "../components/DashboardPageHeader";
import styles from "./$orgId.admin.policies.module.css";

const POLICIES_PER_PAGE = 12;

const PoliciesPage: React.FC = () => {
  const { authState } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { buildUrl } = useOrgNavigation();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Load and save view mode preference
  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem("policy-list-view-mode");
    if (saved === "list") {
      setViewMode("list");
    }
  }, []);

  useEffect(() => {
    // Save to localStorage when view mode changes
    localStorage.setItem("policy-list-view-mode", viewMode);
  }, [viewMode]);

  const canCreatePolicy =
    authState.type === "authenticated" &&
    (authState.user.role === "admin" || authState.user.role === "editor");

  const canDownloadPolicies = authState.type === "authenticated";

  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const department = searchParams.get("department") || "";
  const category = searchParams.get("category") || "";
  const portal = searchParams.get("portal") || "";
  const reviewFilter = searchParams.get("reviewFilter") || "all";

  const [searchTerm, setSearchTerm] = useState(search);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const isReviewMode = reviewFilter === "due" || reviewFilter === "overdue";
  const isAuthenticated = authState.type === "authenticated";

  const regularFilters = useMemo(() => {
    if (isReviewMode) return null;
    
    const publicOnly = !isAuthenticated;
    const params: Parameters<typeof usePolicies>[0] = {
      page,
      limit: POLICIES_PER_PAGE,
      publicOnly,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (status) params.status = status;
    if (department) params.department = department;
    if (category) params.category = category;
    if (portal) params.portal = portal;
    return params;
  }, [
    isReviewMode,
    page,
    isAuthenticated,
    debouncedSearch,
    status,
    department,
    category,
    portal
  ]);

  const reviewFilters = useMemo(() => {
    if (!isReviewMode) return null;
    
    const params: Parameters<typeof useReviewPolicies>[0] = {
      page,
      limit: POLICIES_PER_PAGE,
      overdue_only: reviewFilter === "overdue",
    };
    if (department) params.department = department;
    if (category) params.category = category;
    return params;
  }, [
    isReviewMode,
    page,
    reviewFilter,
    department,
    category,
  ]);

  const regularQuery = usePolicies(regularFilters || { page: 1, limit: 1 });
  const reviewQuery = useReviewPolicies(reviewFilters || { page: 1, limit: 1 });

  const { data, isFetching, error } = isReviewMode ? reviewQuery : regularQuery;

  const convertedPolicies = useMemo(() => {
    if (!data?.policies) return undefined;
    if (isReviewMode && reviewQuery.data) {
      return reviewQuery.data.policies.map(fromReviewEndpoint);
    }
    if (!isReviewMode && regularQuery.data) {
      return regularQuery.data.policies.map(fromListEndpoint);
    }
    return undefined;
  }, [data?.policies, isReviewMode, reviewQuery.data, regularQuery.data]);

  const currentPolicyIds = useMemo(() => {
    return convertedPolicies?.map(policy => policy.id) || [];
  }, [convertedPolicies]);

  const handleFilterChange = (
    key: "search" | "status" | "department" | "category" | "portal" | "reviewFilter",
    value: string
  ) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "__empty") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1"); // Reset to first page on filter change
    setSearchParams(newParams);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // We don't update URL here, debounced effect will do it
  };

  React.useEffect(() => {
    handleFilterChange("search", debouncedSearch);
  }, [debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    setSearchParams(newParams);
    window.scrollTo(0, 0);
  };

  const renderPagination = () => {
    if (!data || data.pagination.totalPages <= 1) return null;

    const { page, totalPages } = data.pagination;
    const items = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (page > 1) {
      items.push(
        <PaginationItem key="prev">
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(page - 1);
            }}
          />
        </PaginationItem>
      );
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(1);
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(<PaginationEllipsis key="start-ellipsis" />);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            isActive={i === page}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<PaginationEllipsis key="end-ellipsis" />);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(totalPages);
            }}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (page < totalPages) {
      items.push(
        <PaginationItem key="next">
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(page + 1);
            }}
          />
        </PaginationItem>
      );
    }

    return (
      <Pagination>
        <PaginationContent>{items}</PaginationContent>
      </Pagination>
    );
  };

  return (
    <>
      <Helmet>
        <title>Policies - MyPolicyPortal</title>
        <meta
          name="description"
          content="Browse, search, and filter all available policies."
        />
      </Helmet>
      <div className={styles.container}>
        <DashboardPageHeader
          title="Policy Library"
          subtitle="Find and review all company policies. Use the filters to narrow your search."
          actions={
            (canCreatePolicy || canDownloadPolicies) && (
              <div className={styles.headerActions}>
                {canDownloadPolicies && (
                  <BulkPolicyDownload policyIds={currentPolicyIds} />
                )}
                <div className={styles.viewToggle}>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    title="Card view"
                  >
                    <Grid3X3 size={18} />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    title="List view"
                  >
                    <List size={18} />
                  </Button>
                </div>
                {canCreatePolicy && (
                  <>
                    <Button variant="outline" asChild>
                      <Link to={buildUrl('/admin/policy-templates')}>
                        <FileText size={18} />
                        Browse Templates
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link to={buildUrl('/admin/policies/create')}>
                        <PlusCircle size={18} />
                        Create / Import Policy
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            )
          }
        />

        <PolicyFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          status={status}
          department={department}
          category={category}
          portal={portal}
          reviewFilter={reviewFilter}
          onFilterChange={(key, value) => handleFilterChange(key, value)}
          showReviewFilter={isAuthenticated}
          isReviewMode={isReviewMode}
        />

        <main className={styles.mainContent}>
          <PolicyList
            policies={convertedPolicies}
            isLoading={isFetching}
            error={error}
            skeletonsCount={POLICIES_PER_PAGE}
            viewMode={viewMode}
          />
          <div className={styles.paginationContainer}>
            {renderPagination()}
          </div>
        </main>
      </div>
    </>
  );
};

export default PoliciesPage;