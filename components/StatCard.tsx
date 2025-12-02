import React from 'react';
import { Skeleton } from './Skeleton';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, isLoading, className }) => {
  if (isLoading) {
    return (
      <div className={`${styles.card} ${className || ''}`}>
        <div className={styles.header}>
          <Skeleton className={styles.titleSkeleton} />
          <Skeleton className={styles.iconSkeleton} />
        </div>
        <Skeleton className={styles.valueSkeleton} />
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.iconWrapper}>{icon}</div>
      </div>
      <p className={styles.value}>{value}</p>
    </div>
  );
};