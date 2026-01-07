import React from 'react';
import { Link } from 'react-router-dom';
import styles from './QuickActionCard.module.css';

export type QuickActionColor = 'coral' | 'blue' | 'purple' | 'green';

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  to: string;
  color: QuickActionColor;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  title,
  description,
  buttonText,
  to,
  color,
}) => {
  return (
    <div className={styles.card}>
      <div className={`${styles.iconWrapper} ${styles[color]}`}>
        {icon}
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      <Link to={to} className={styles.button}>
        {buttonText}
      </Link>
    </div>
  );
};
