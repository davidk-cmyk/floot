import React from "react";
import { LayoutGrid, Star, Clock, ChevronRight } from "lucide-react";
import styles from "./PortalSidebar.module.css";

export type PortalView = "all" | "favorites" | "recent";

interface PortalSidebarProps {
  categories: string[];
  activeView: PortalView;
  activeCategory: string | null;
  onNavigate: (view: PortalView, category: string | null) => void;
  className?: string;
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({
  categories,
  activeView,
  activeCategory,
  onNavigate,
  className,
}) => {
  const isAllActive = activeView === "all" && activeCategory === null;
  const isFavoritesActive = activeView === "favorites";
  const isRecentActive = activeView === "recent";

  return (
    <nav className={`${styles.sidebar} ${className || ""}`}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Portal</h3>
        <ul className={styles.navList}>
          <li>
            <button
              className={`${styles.navItem} ${isAllActive ? styles.active : ""}`}
              onClick={() => onNavigate("all", null)}
            >
              <LayoutGrid size={18} />
              <span>All Policies</span>
            </button>
          </li>
          <li>
            <button
              className={`${styles.navItem} ${isFavoritesActive ? styles.active : ""}`}
              onClick={() => onNavigate("favorites", null)}
            >
              <Star size={18} />
              <span>My Favorites</span>
            </button>
          </li>
          <li>
            <button
              className={`${styles.navItem} ${isRecentActive ? styles.active : ""}`}
              onClick={() => onNavigate("recent", null)}
            >
              <Clock size={18} />
              <span>Recent Updates</span>
            </button>
          </li>
        </ul>
      </div>

      {categories.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Categories</h3>
          <ul className={styles.categoryList}>
            {categories.map((category) => {
              const isActive = activeView === "all" && activeCategory === category;
              return (
                <li key={category}>
                  <button
                    className={`${styles.categoryItem} ${isActive ? styles.active : ""}`}
                    onClick={() => onNavigate("all", category)}
                  >
                    <span className={styles.categoryName}>{category}</span>
                    {isActive && <ChevronRight size={14} className={styles.activeIndicator} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
};