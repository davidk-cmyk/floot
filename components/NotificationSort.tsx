import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Button } from "./Button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { InputType as ListInputType } from "../endpoints/notifications/list_GET.schema";
import styles from "./NotificationSort.module.css";

interface NotificationSortProps {
  sortBy: ListInputType["sortBy"];
  sortOrder: ListInputType["sortOrder"];
  onSortChange: (
    sortBy: ListInputType["sortBy"],
    sortOrder: ListInputType["sortOrder"]
  ) => void;
}

export const NotificationSort = ({
  sortBy,
  sortOrder,
  onSortChange,
}: NotificationSortProps) => {
  const handleSortByChange = (newSortBy: ListInputType["sortBy"]) => {
    onSortChange(newSortBy, sortOrder);
  };

  const toggleSortOrder = () => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    onSortChange(sortBy, newSortOrder);
  };

  return (
    <div className={styles.sortContainer}>
      <Select value={sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className={styles.selectTrigger} aria-label="Sort notifications by">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Date</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
          <SelectItem value="type">Type</SelectItem>
          <SelectItem value="status">Status</SelectItem>
        </SelectContent>
      </Select>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={toggleSortOrder}
        aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
      >
        {sortOrder === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
      </Button>
    </div>
  );
};