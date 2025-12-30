import React, { useCallback, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Button } from './Button';
import { X } from 'lucide-react';
import styles from './DateDropdownSelector.module.css';

interface DateDropdownSelectorProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
  placeholder?: string;
  allowClear?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DateDropdownSelector: React.FC<DateDropdownSelectorProps> = ({
  value,
  onChange,
  minYear,
  maxYear,
  disabled = false,
  placeholder = 'Select date',
  allowClear = true,
}) => {
  const safeDate = useMemo(() => {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }, [value]);

  const selectedDay = safeDate ? safeDate.getDate().toString() : '';
  const selectedMonth = safeDate ? safeDate.getMonth().toString() : '';
  const selectedYear = safeDate ? safeDate.getFullYear().toString() : '';

  const getDaysInMonth = useCallback((month: number, year: number): number => {
    if (isNaN(month) || isNaN(year)) return 31;
    return new Date(year, month + 1, 0).getDate();
  }, []);

  const currentMonth = selectedMonth !== '' ? parseInt(selectedMonth) : new Date().getMonth();
  const currentYear = selectedYear !== '' ? parseInt(selectedYear) : new Date().getFullYear();
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);

  const years = useMemo(() => {
    const currentYearNum = new Date().getFullYear();
    const valueYear = safeDate?.getFullYear();
    const effectiveMinYear = minYear ?? Math.min(currentYearNum - 10, valueYear ?? currentYearNum);
    const effectiveMaxYear = maxYear ?? Math.max(currentYearNum + 20, valueYear ?? currentYearNum);
    const arr: number[] = [];
    for (let y = effectiveMinYear; y <= effectiveMaxYear; y++) {
      arr.push(y);
    }
    return arr;
  }, [minYear, maxYear, safeDate]);

  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const days = useMemo(() => {
    const arr: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(d);
    }
    return arr;
  }, [daysInMonth]);

  const handleDayChange = useCallback((day: string) => {
    if (!day) return;
    const newDay = parseInt(day);
    const month = selectedMonth !== '' ? parseInt(selectedMonth) : 0;
    const year = selectedYear !== '' ? parseInt(selectedYear) : new Date().getFullYear();
    onChange(new Date(year, month, newDay));
  }, [selectedMonth, selectedYear, onChange]);

  const handleMonthChange = useCallback((month: string) => {
    if (!month) return;
    const newMonth = parseInt(month);
    const day = selectedDay !== '' ? Math.min(parseInt(selectedDay), getDaysInMonth(newMonth, parseInt(selectedYear) || new Date().getFullYear())) : 1;
    const year = selectedYear !== '' ? parseInt(selectedYear) : new Date().getFullYear();
    onChange(new Date(year, newMonth, day));
  }, [selectedDay, selectedYear, getDaysInMonth, onChange]);

  const handleYearChange = useCallback((year: string) => {
    if (!year) return;
    const newYear = parseInt(year);
    const month = selectedMonth !== '' ? parseInt(selectedMonth) : 0;
    const day = selectedDay !== '' ? Math.min(parseInt(selectedDay), getDaysInMonth(month, newYear)) : 1;
    onChange(new Date(newYear, month, day));
  }, [selectedDay, selectedMonth, getDaysInMonth, onChange]);

  return (
    <div className={styles.container}>
      <Select 
        value={selectedDay} 
        onValueChange={handleDayChange}
        disabled={disabled}
      >
        <SelectTrigger className={styles.daySelect}>
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {days.map((day) => (
            <SelectItem key={day} value={day.toString()}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={selectedMonth} 
        onValueChange={handleMonthChange}
        disabled={disabled}
      >
        <SelectTrigger className={styles.monthSelect}>
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((month, index) => (
            <SelectItem key={month} value={index.toString()}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={selectedYear} 
        onValueChange={handleYearChange}
        disabled={disabled}
      >
        <SelectTrigger className={styles.yearSelect}>
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {allowClear && safeDate && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className={styles.clearButton}
          title="Clear date"
        >
          <X size={14} />
        </Button>
      )}
    </div>
  );
};
