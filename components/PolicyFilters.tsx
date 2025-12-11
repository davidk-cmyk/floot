import React from "react";
import { usePolicyFilterMetadata } from "../helpers/usePolicyApi";
import { Input } from "./Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Search, Grid3X3, List } from "lucide-react";
import { Button } from "./Button";
import styles from "./PolicyFilters.module.css";

interface PolicyFiltersProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  status: string;
  department: string;
  category: string;
  portal?: string;
  reviewFilter?: string;
  onFilterChange: (
    key: "status" | "department" | "category" | "portal" | "reviewFilter" | "search",
    value: string
  ) => void;
  className?: string;
  publicOnly?: boolean;
  showReviewFilter?: boolean;
  isReviewMode?: boolean;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
}

export const PolicyFilters: React.FC<PolicyFiltersProps> = ({
  searchTerm,
  onSearchChange,
  status,
  department,
  category,
  portal = "__empty",
  reviewFilter = "all",
  onFilterChange,
  className,
  publicOnly = false,
  showReviewFilter = false,
  isReviewMode = false,
  viewMode = "grid",
  onViewModeChange,
}) => {
  const { data: metadata, isLoading } = usePolicyFilterMetadata();

  return (
    <div className={`${styles.filtersContainer} ${className || ""}`}>
      <div className={styles.filterHeader}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <Input
            type="text"
            placeholder={
              isReviewMode 
                ? "Search policies by title..." 
                : "Search policies by title or content..."
            }
            value={searchTerm}
            onChange={onSearchChange}
            className={styles.searchInput}
            disabled={isReviewMode}
          />
        </div>
        {onViewModeChange && (
          <div className={styles.viewToggle}>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => onViewModeChange("grid")}
              title="Card view"
            >
              <Grid3X3 size={18} />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => onViewModeChange("list")}
              title="List view"
            >
              <List size={18} />
            </Button>
          </div>
        )}
      </div>
      <div className={styles.selectsWrapper}>
        {showReviewFilter && (
          <Select
            value={reviewFilter}
            onValueChange={(value) => onFilterChange("reviewFilter", value)}
          >
            <SelectTrigger className={styles.selectTrigger}>
              <SelectValue placeholder="Filter by review status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Policies</SelectItem>
              <SelectItem value="due">Due for Review</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        )}
        {!isReviewMode && (
          <Select
            value={status}
            onValueChange={(value) => onFilterChange("status", value)}
            disabled={isLoading}
          >
            <SelectTrigger className={styles.selectTrigger}>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__empty">All Statuses</SelectItem>
              {metadata?.statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={department}
          onValueChange={(value) => onFilterChange("department", value)}
          disabled={isLoading}
        >
          <SelectTrigger className={styles.selectTrigger}>
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty">All Departments</SelectItem>
            {metadata?.departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={category}
          onValueChange={(value) => onFilterChange("category", value)}
          disabled={isLoading}
        >
          <SelectTrigger className={styles.selectTrigger}>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__empty">All Categories</SelectItem>
            {metadata?.categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!publicOnly && (
          <Select
            value={portal}
            onValueChange={(value) => onFilterChange("portal", value)}
            disabled={isLoading}
          >
            <SelectTrigger className={styles.selectTrigger}>
              <SelectValue placeholder="Filter by portal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__empty">All Portals</SelectItem>
              {metadata?.portals?.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};