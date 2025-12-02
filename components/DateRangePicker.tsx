import React, { useState, useMemo } from 'react';
import {
  addDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
  startOfYear,
  endOfYear,
  subYears,
  format,
  isSameDay,
} from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { Button } from './Button';
import { Calendar } from './Calendar';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';
import styles from './DateRangePicker.module.css';

type Preset = {
  label: string;
  range: () => { from: Date; to: Date };
};

const presets: Preset[] = [
  {
    label: 'Last 7 days',
    range: () => ({ from: addDays(new Date(), -6), to: new Date() }),
  },
  {
    label: 'Last 30 days',
    range: () => ({ from: addDays(new Date(), -29), to: new Date() }),
  },
  {
    label: 'Last 90 days',
    range: () => ({ from: addDays(new Date(), -89), to: new Date() }),
  },
  {
    label: 'This month',
    range: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Last month',
    range: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: 'This quarter',
    range: () => ({
      from: startOfQuarter(new Date()),
      to: endOfQuarter(new Date()),
    }),
  },
  {
    label: 'Last quarter',
    range: () => {
      const lastQuarter = subQuarters(new Date(), 1);
      return {
        from: startOfQuarter(lastQuarter),
        to: endOfQuarter(lastQuarter),
      };
    },
  },
  {
    label: 'This year',
    range: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
  {
    label: 'Last year',
    range: () => {
      const lastYear = subYears(new Date(), 1);
      return {
        from: startOfYear(lastYear),
        to: endOfYear(lastYear),
      };
    },
  },
  {
    label: 'Last 12 months',
    range: () => ({ from: subYears(new Date(), 1), to: new Date() }),
  },
];

interface DateRangePickerProps {
  value: DateRange | undefined | null;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

export const DateRangePicker = ({
  value,
  onChange,
  placeholder = 'Select date range',
  className,
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const displayValue = useMemo(() => {
    if (!value?.from) {
      return placeholder;
    }

    const fromFormatted = format(value.from, 'LLL d, y');
    if (!value.to) {
      return fromFormatted;
    }

    const toFormatted = format(value.to, 'LLL d, y');
    if (fromFormatted === toFormatted) {
      return fromFormatted;
    }

    return `${fromFormatted} - ${toFormatted}`;
  }, [value, placeholder]);

  const activePreset = useMemo(() => {
    if (!value?.from || !value.to) return null;

    for (const preset of presets) {
      const presetRange = preset.range();
      if (
        isSameDay(value.from, presetRange.from) &&
        isSameDay(value.to, presetRange.to)
      ) {
        return preset.label;
      }
    }
    return null;
  }, [value]);

  const handlePresetClick = (preset: Preset) => {
    onChange(preset.range());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`${styles.triggerButton} ${className ?? ''}`}
        >
          <CalendarIcon size={16} className={styles.calendarIcon} />
          <span className={styles.dateDisplay}>{displayValue}</span>
          {value?.from && (
            <Button
              variant="ghost"
              size="icon-sm"
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear date range"
            >
              <X size={14} />
            </Button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={styles.popoverContent}
        align="start"
        removeBackgroundAndPadding
      >
        <div className={styles.container}>
          <div className={styles.sidebar}>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                className={`${styles.presetButton} ${
                  activePreset === preset.label ? styles.activePreset : ''
                }`}
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className={styles.calendarContainer}>
            <Calendar
              mode="range"
              selected={value ?? undefined}
              onSelect={onChange}
              numberOfMonths={1}
              defaultMonth={value?.from}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};