import React, { forwardRef } from 'react';
import styles from './Switch.module.css';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled = false, id, className, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        id={id}
        className={`${styles.switch} ${checked ? styles.checked : ''} ${disabled ? styles.disabled : ''} ${className || ''}`}
        onClick={handleClick}
        {...props}
      >
        <span className={styles.thumb} />
      </button>
    );
  }
);

Switch.displayName = 'Switch';