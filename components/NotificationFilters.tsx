import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./Sheet";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Calendar } from "./Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Filter, Calendar as CalendarIcon } from "lucide-react";
import { InputType as ListInputType } from "../endpoints/notifications/list_GET.schema";
import styles from "./NotificationFilters.module.css";

interface NotificationFiltersProps {
  currentFilters: Partial<ListInputType>;
  onFilterChange: (
    newFilters: Record<string, string | string[] | undefined>
  ) => void;
}

const NOTIFICATION_TYPES = [
  { value: "policy_assignment", label: "Policy Assignment" },
  { value: "acknowledgement_reminder", label: "Acknowledgement Reminder" },
  { value: "policy_update", label: "Policy Update" },
  { value: "policy_approval_required", label: "Approval Required" },
  { value: "info", label: "General Info" },
];

export const NotificationFilters = ({
  currentFilters,
  onFilterChange,
}: NotificationFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = (status: string) => {
    onFilterChange({ status: status === "all" ? undefined : status });
    setIsOpen(false);
  };

  const handleTypeChange = (type: string, checked: boolean) => {
    const currentTypes = currentFilters.types || [];
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter((t) => t !== type);
    onFilterChange({ types: newTypes });
  };

  const handlePriorityChange = (priority: string) => {
    onFilterChange({ priority: priority === "__empty" ? undefined : priority });
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    onFilterChange({
      dateRange: range ? "custom" : undefined,
      startDate: range?.from?.toISOString(),
      endDate: range?.to?.toISOString(),
    });
  };

  const handleQuickDateChange = (range: string) => {
    onFilterChange({
      dateRange: range === "__empty" ? undefined : range,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      status: undefined,
      types: undefined,
      priority: undefined,
      dateRange: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setIsOpen(false);
  };

  const activeFilterCount = [
    currentFilters.status && currentFilters.status !== 'all',
    currentFilters.types && currentFilters.types.length > 0,
    currentFilters.priority,
    currentFilters.dateRange,
  ].filter(Boolean).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" aria-label={`Filter notifications${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}>
          <Filter size={16} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className={styles.filterCount} aria-hidden="true">{activeFilterCount}</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter Notifications</SheetTitle>
        </SheetHeader>
        <div className={styles.filterContent}>
          <div className={styles.filterGroup}>
            <h4 className={styles.groupTitle}>Status</h4>
            <div className={styles.statusButtons} role="group" aria-label="Filter by status">
              <Button
                variant={!currentFilters.status || currentFilters.status === 'all' ? 'primary' : 'outline'}
                onClick={() => handleStatusChange('all')}
                aria-pressed={!currentFilters.status || currentFilters.status === 'all'}
              >
                All
              </Button>
              <Button
                variant={currentFilters.status === 'unread' ? 'primary' : 'outline'}
                onClick={() => handleStatusChange('unread')}
                aria-pressed={currentFilters.status === 'unread'}
              >
                Unread
              </Button>
              <Button
                variant={currentFilters.status === 'read' ? 'primary' : 'outline'}
                onClick={() => handleStatusChange('read')}
                aria-pressed={currentFilters.status === 'read'}
              >
                Read
              </Button>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h4 className={styles.groupTitle}>Type</h4>
            <div className={styles.typeList} role="group" aria-label="Filter by notification type">
              {NOTIFICATION_TYPES.map((type) => (
                <label key={type.value} className={styles.checkboxLabel}>
                  <Checkbox
                    checked={(currentFilters.types || []).includes(type.value)}
                    onChange={(event) => handleTypeChange(type.value, event.target.checked)}
                    aria-describedby={`type-${type.value}-label`}
                  />
                  <span id={`type-${type.value}-label`}>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h4 className={styles.groupTitle}>Priority</h4>
            <Select
              value={currentFilters.priority || "__empty"}
              onValueChange={handlePriorityChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__empty">Any Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={styles.filterGroup}>
            <h4 className={styles.groupTitle}>Date Range</h4>
            <Select
              value={currentFilters.dateRange && currentFilters.dateRange !== 'custom' ? currentFilters.dateRange : "__empty"}
              onValueChange={handleQuickDateChange}
            >
              <SelectTrigger className={styles.dateSelect}>
                <SelectValue placeholder="Select a date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__empty">Any Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={styles.datePickerButton}>
                  <CalendarIcon size={16} />
                  <span>
                    {currentFilters.startDate && currentFilters.endDate
                      ? `${new Date(currentFilters.startDate).toLocaleDateString()} - ${new Date(currentFilters.endDate).toLocaleDateString()}`
                      : "Custom Range"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent removeBackgroundAndPadding>
                <Calendar
                  mode="range"
                  selected={{
                    from: currentFilters.startDate ? new Date(currentFilters.startDate) : undefined,
                    to: currentFilters.endDate ? new Date(currentFilters.endDate) : undefined,
                  }}
                  onSelect={handleDateRangeChange}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className={styles.footer}>
            <Button variant="ghost" onClick={clearFilters} aria-label="Clear all active filters">
              Clear All Filters
            </Button>
            <Button onClick={() => setIsOpen(false)} aria-label="Apply filters and close">
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};