import React from "react";
import styles from "./PortalCategoryTabs.module.css";

interface PortalCategoryTabsProps {
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  className?: string;
}

export const PortalCategoryTabs: React.FC<PortalCategoryTabsProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  className,
}) => {
  return (
    <div className={`${styles.container} ${className || ""}`}>
      <button
        className={`${styles.tab} ${activeCategory === null ? styles.active : ""}`}
        onClick={() => onCategoryChange(null)}
        type="button"
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          className={`${styles.tab} ${activeCategory === category ? styles.active : ""}`}
          onClick={() => onCategoryChange(category)}
          type="button"
        >
          {category}
        </button>
      ))}
    </div>
  );
};