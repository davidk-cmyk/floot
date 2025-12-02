import React from 'react';
import { Skeleton } from './Skeleton';
import styles from './PolicyDetailSkeleton.module.css';

export const PolicyDetailSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <Skeleton style={{ height: '2.5rem', width: '70%' }} />
          <Skeleton style={{ height: '1.5rem', width: '80px' }} />
        </div>
        <div className={styles.metaGrid}>
          <Skeleton style={{ height: '1rem', width: '220px' }} />
          <Skeleton style={{ height: '1rem', width: '200px' }} />
          <Skeleton style={{ height: '1rem', width: '180px' }} />
        </div>
        <div className={styles.userInfoGrid}>
          <div className={styles.authorInfo}>
            <Skeleton style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)' }} />
            <div className={styles.authorText}>
              <Skeleton style={{ height: '1rem', width: '120px' }} />
              <Skeleton style={{ height: '0.75rem', width: '60px' }} />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <Skeleton style={{ height: '1rem', width: '90%' }} />
        <Skeleton style={{ height: '1rem', width: '95%' }} />
        <Skeleton style={{ height: '1rem', width: '85%' }} />
        <br />
        <Skeleton style={{ height: '1.5rem', width: '40%', marginTop: 'var(--spacing-4)' }} />
        <Skeleton style={{ height: '1rem', width: '100%', marginTop: 'var(--spacing-4)' }} />
        <Skeleton style={{ height: '1rem', width: '100%' }} />
        <Skeleton style={{ height: '1rem', width: '60%' }} />
      </div>
    </div>
  );
};