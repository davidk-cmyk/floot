import React from 'react';
import { Skeleton } from './Skeleton';
import styles from './PolicyUpdateFormSkeleton.module.css';

export const PolicyUpdateFormSkeleton = () => {
  return (
    <div className={styles.form}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Skeleton style={{ width: '200px', height: '2rem' }} />
          <Skeleton style={{ width: '80px', height: '1.5rem' }} />
        </div>
        <Skeleton style={{ width: '120px', height: '2.25rem' }} />
      </div>

      <div className={styles.formItem}>
        <Skeleton style={{ width: '80px', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
        <Skeleton style={{ width: '100%', height: '2.5rem' }} />
      </div>

      <div className={styles.formItem}>
        <Skeleton style={{ width: '80px', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
        <Skeleton style={{ width: '100%', height: '250px' }} />
      </div>

      <div className={styles.formItem}>
        <Skeleton style={{ width: '120px', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
        <Skeleton style={{ width: '100%', height: '5rem' }} />
      </div>

      <div className={styles.grid}>
        <div className={styles.formItem}>
          <Skeleton style={{ width: '60px', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ width: '100%', height: '2.5rem' }} />
        </div>
        <div className={styles.formItem}>
          <Skeleton style={{ width: '100px', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ width: '100%', height: '2.5rem' }} />
        </div>
        <div className={styles.formItem}>
          <Skeleton style={{ width: '110px', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ width: '100%', height: '2.5rem' }} />
        </div>
        <div className={styles.formItem}>
          <Skeleton style={{ width: '90px', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ width: '100%', height: '2.5rem' }} />
        </div>
        <div className={styles.formItem}>
          <Skeleton style={{ width: '80px', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ width: '100%', height: '2.5rem' }} />
        </div>
      </div>

      <div className={styles.formItem}>
        <Skeleton style={{ width: '50px', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
        <Skeleton style={{ width: '100%', height: '2.5rem' }} />
        <Skeleton style={{ width: '100px', height: '2rem', marginTop: 'var(--spacing-3)' }} />
      </div>

      <div className={styles.switchContainer}>
        <div className={styles.switchItem}>
          <div className={styles.switchLabelWrapper}>
            <Skeleton style={{ width: '100px', height: '1rem' }} />
            <Skeleton style={{ width: '250px', height: '0.875rem' }} />
          </div>
          <Skeleton style={{ width: '50px', height: '1.5rem' }} />
        </div>
        <div className={styles.switchItem}>
          <div className={styles.switchLabelWrapper}>
            <Skeleton style={{ width: '180px', height: '1rem' }} />
            <Skeleton style={{ width: '280px', height: '0.875rem' }} />
          </div>
          <Skeleton style={{ width: '50px', height: '1.5rem' }} />
        </div>
      </div>

      <div className={styles.footer}>
        <Skeleton style={{ width: '120px', height: '2.5rem' }} />
      </div>
    </div>
  );
};