import React, { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "./Input";
import styles from "./NotificationSearch.module.css";

interface NotificationSearchProps {
  initialValue?: string;
  onSearch: (query: string | undefined) => void;
}

export const NotificationSearch = ({
  initialValue = "",
  onSearch,
}: NotificationSearchProps) => {
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      onSearch(query || undefined);
    }, 300);
  };

  const handleClear = () => {
    onSearch(undefined);
  };

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <div className={styles.searchContainer}>
      <Search size={18} className={styles.searchIcon} />
      <Input
        type="search"
        placeholder="Search notifications..."
        value={initialValue}
        onChange={handleInputChange}
        className={styles.searchInput}
        aria-label="Search notifications"
      />
      {initialValue && (
        <button 
          onClick={handleClear} 
          className={styles.clearButton}
          aria-label="Clear search"
          type="button"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};