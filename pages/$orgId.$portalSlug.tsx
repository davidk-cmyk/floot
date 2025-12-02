import React, { useState, useMemo, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useDebounce } from "../helpers/useDebounce";
import { usePortalPolicies } from "../helpers/usePortalApi";
import { usePortalPassword } from "../helpers/usePortalPassword";
import { Skeleton } from "../components/Skeleton";
import { PolicyList } from "../components/PolicyList";
import { PortalHero } from "../components/PortalHero";
import { PortalCategoryTabs } from "../components/PortalCategoryTabs";
import { PortalSidebar, PortalView } from "../components/PortalSidebar";
import { fromPortalEndpoint } from "../helpers/policyCardData";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "../components/Pagination";
import { PasswordPrompt } from "../components/PasswordPrompt";
import { useAuth } from "../helpers/useAuth";
import { AlertTriangle, Info, ArrowLeft } from "lucide-react";
import styles from "./$orgId.$portalSlug.module.css";

const POLICIES_PER_PAGE = 12;

const PortalPage: React.FC = () => {
  const { orgId, portalSlug } = useParams<{ orgId: string; portalSlug: string }>();
  
  // Check if we're viewing a placeholder route in the editor
  if (portalSlug?.startsWith(':') || orgId?.startsWith(':')) {
    return (
      <div className={styles.messageContainer}>
        <Info size={48} className={styles.infoIcon} />
        <h1>Dynamic Portal Page</h1>
        <p>This is a dynamic page template. Navigate to an actual portal URL to see content.</p>
        <p className={styles.exampleText}>Example: <code>/123/public</code> or <code>/123/internal</code></p>
      </div>
    );
  }
  
  const [searchParams, setSearchParams] = useSearchParams();
  const { authState } = useAuth();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";

  const [searchTerm, setSearchTerm] = useState(search);
  const [activeView, setActiveView] = useState<PortalView>("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(categoryFilter || null);
  const { password, setPassword } = usePortalPassword(portalSlug!);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const filters = useMemo(() => {
    const params: Parameters<typeof usePortalPolicies>[1] = {
      page,
      limit: POLICIES_PER_PAGE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (activeCategory) params.category = activeCategory;
    if (password) params.password = password;
    return params;
  }, [page, debouncedSearch, activeCategory, password]);

  const { data, isFetching, error } = usePortalPolicies(
    portalSlug!,
    filters,
  );

  // Extract unique categories from policies
  const categories = useMemo(() => {
    if (!data?.policies) return [];
    const cats = new Set(
      data.policies
        .map(p => p.category)
        .filter((cat): cat is string => Boolean(cat))
    );
    return Array.from(cats).sort();
  }, [data?.policies]);

  // Convert and filter policies based on active view
  const convertedPolicies = useMemo(() => {
    if (!data?.policies) return undefined;
    
    let filteredPolicies = data.policies;

    // Apply view-based filtering
    if (activeView === "favorites") {
      // For now, filter to acknowledged policies as a placeholder for favorites
      filteredPolicies = filteredPolicies.filter(p => p.acknowledged);
    } else if (activeView === "recent") {
      // Filter to policies updated in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filteredPolicies = filteredPolicies.filter(p => {
        if (!p.updatedAt) return false;
        const updatedDate = new Date(p.updatedAt);
        return updatedDate >= sevenDaysAgo;
      });
    }

    return filteredPolicies.map(fromPortalEndpoint);
  }, [data?.policies, activeView]);

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      newParams.set("search", debouncedSearch);
    } else {
      newParams.delete("search");
    }
    newParams.set("page", "1");
    setSearchParams(newParams, { replace: true });
  }, [debouncedSearch]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryChange = (category: string | null) => {
    setActiveCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category) {
      newParams.set("category", category);
    } else {
      newParams.delete("category");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleSidebarNavigate = (view: PortalView, category: string | null) => {
    setActiveView(view);
    setActiveCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category) {
      newParams.set("category", category);
    } else {
      newParams.delete("category");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    setSearchParams(newParams);
    window.scrollTo(0, 0);
  };

  const handlePasswordSubmit = (submittedPassword: string) => {
    setPassword(submittedPassword);
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
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }}>1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(<PaginationEllipsis key="start-ellipsis" />);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink href="#" isActive={i === page} onClick={(e) => { e.preventDefault(); handlePageChange(i); }}>{i}</PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<PaginationEllipsis key="end-ellipsis" />);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }}>{totalPages}</PaginationLink>
        </PaginationItem>
      );
    }

    if (page < totalPages) {
      items.push(
        <PaginationItem key="next">
          <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page + 1); }} />
        </PaginationItem>
      );
    }

    return (
      <Pagination>
        <PaginationContent>{items}</PaginationContent>
      </Pagination>
    );
  };

  if (isFetching && !data) {
    return (
      <div className={styles.loadingContainer}>
        <Skeleton style={{ width: "100%", height: "300px", marginBottom: "var(--spacing-8)" }} />
        <div className={styles.contentGrid}>
          <aside className={styles.sidebar}>
            <Skeleton style={{ width: "100%", height: "400px" }} />
          </aside>
          <div className={styles.mainContent}>
            <Skeleton style={{ width: "100%", height: "60px", marginBottom: "var(--spacing-6)" }} />
            <PolicyList policies={undefined} isLoading={true} error={null} skeletonsCount={POLICIES_PER_PAGE} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    if (errorMessage.includes("password")) {
      return <PasswordPrompt portalName={data?.portal.name || portalSlug || ""} onSubmit={handlePasswordSubmit} error="Invalid password. Please try again." />;
    }
    if (errorMessage.includes("unauthorized")) {
      return (
        <div className={styles.messageContainer}>
          <AlertTriangle size={48} className={styles.errorIcon} />
          <h1>Access Denied</h1>
          <p>You do not have permission to view this portal.</p>
          {authState.type === 'unauthenticated' && (
            <p>Please <Link to={`/login?redirect=/${orgId}/${portalSlug}`}>log in</Link> to continue.</p>
          )}
        </div>
      );
    }
    return (
      <div className={styles.messageContainer}>
        <AlertTriangle size={48} className={styles.errorIcon} />
        <h1>Portal Not Found or Error</h1>
        <p>{errorMessage}</p>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.messageContainer}>
        <Info size={48} className={styles.infoIcon} />
        <h1>Portal Not Found</h1>
        <p>The portal you are looking for does not exist.</p>
      </div>
    );
  }

  if (data.portal.accessType === 'password' && !password) {
    return <PasswordPrompt portalName={data.portal.name} onSubmit={handlePasswordSubmit} />;
  }

  return (
    <>
      <Helmet>
        <title>{data.portal.name}</title>
        <meta name="description" content={data.portal.description || `Browse policies in the ${data.portal.name} portal.`} />
      </Helmet>
      <div className={styles.container}>
        <PortalHero
          portalName={data.portal.name}
          description={data.portal.description}
          portalType="Internal Portal"
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />

        <div className={styles.contentGrid}>
          <aside className={styles.sidebar}>
            <PortalSidebar
              categories={categories}
              activeView={activeView}
              activeCategory={activeCategory}
              onNavigate={handleSidebarNavigate}
            />
          </aside>

          <main className={styles.mainContent}>
            <PortalCategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />

            <PolicyList
              policies={convertedPolicies}
              isLoading={isFetching}
              error={null}
              skeletonsCount={POLICIES_PER_PAGE}
              portalSlug={portalSlug}
            />
            
            <div className={styles.paginationContainer}>
              {renderPagination()}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default PortalPage;