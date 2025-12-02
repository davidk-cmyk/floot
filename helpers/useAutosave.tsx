import { useEffect, useCallback, useRef, useState } from 'react';
import { useDebounce } from './useDebounce';
import { toast } from 'sonner';

interface UseAutosaveProps<T> {
  values: T;
  storageKey: string;
  onRestore: (data: T) => void;
  debounceMs?: number;
  enabled?: boolean;
}

type AutosaveStatus = 'idle' | 'saving' | 'error';

/**
 * A hook to manage autosaving form data to localStorage and restoring it on mount.
 *
 * @template T The type of the data to be saved.
 * @param {UseAutosaveProps<T>} props The configuration for the hook.
 * @returns An object containing status, lastSaved, hasUnsavedChanges, saveNow, and clearAutosavedData.
 */
export function useAutosave<T extends object>({
  values,
  storageKey,
  onRestore,
  debounceMs = 30000,
  enabled = true,
}: UseAutosaveProps<T>) {
  const debouncedValues = useDebounce(values, debounceMs);
  const restoredRef = useRef(false);
  const lastSavedValuesRef = useRef<T | null>(null);
  
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check for unsaved changes by comparing current values with last saved values
  useEffect(() => {
    if (!lastSavedValuesRef.current) {
      // If we haven't saved anything yet, check if form has any content
      const hasContent = Object.values(values).some(
        (value) =>
          (typeof value === 'string' && value.length > 0) ||
          (Array.isArray(value) && value.length > 0) ||
          (value instanceof Date)
      );
      setHasUnsavedChanges(hasContent);
    } else {
      // Compare current values with last saved values
      const hasChanges = JSON.stringify(values) !== JSON.stringify(lastSavedValuesRef.current);
      setHasUnsavedChanges(hasChanges);
    }
  }, [values]);

  const performAutosave = useCallback(async () => {
    if (!enabled) return;

    // Avoid saving if the form is essentially empty
    const hasContent = Object.values(debouncedValues).some(
      (value) =>
        (typeof value === 'string' && value.length > 0) ||
        (Array.isArray(value) && value.length > 0) ||
        (value instanceof Date)
    );

    if (!hasContent) {
      return;
    }

    setStatus('saving');

    try {
      const autosaveData = {
        ...debouncedValues,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(autosaveData));
      
      const savedTime = new Date();
      setLastSaved(savedTime);
      setStatus('idle');
      lastSavedValuesRef.current = { ...debouncedValues };
    } catch (error) {
      console.error('Autosave failed:', error);
      setStatus('error');
      toast.error('Failed to save draft automatically.');
    }
  }, [debouncedValues, storageKey, enabled]);

  // Function to trigger immediate autosave
  const saveNow = useCallback(async () => {
    if (!enabled) return;

    // Use current values instead of debounced values for immediate save
    const hasContent = Object.values(values).some(
      (value) =>
        (typeof value === 'string' && value.length > 0) ||
        (Array.isArray(value) && value.length > 0) ||
        (value instanceof Date)
    );

    if (!hasContent) {
      return;
    }

    setStatus('saving');

    try {
      const autosaveData = {
        ...values,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(autosaveData));
      
      const savedTime = new Date();
      setLastSaved(savedTime);
      setStatus('idle');
      lastSavedValuesRef.current = { ...values };
    } catch (error) {
      console.error('Manual save failed:', error);
      setStatus('error');
      toast.error('Failed to save draft.');
    }
  }, [values, storageKey, enabled]);

  // Effect to trigger autosave when debounced values change
  useEffect(() => {
    if (enabled) {
      performAutosave();
    }
  }, [debouncedValues, performAutosave, enabled]);

  // Effect to restore data on initial mount
  useEffect(() => {
    if (restoredRef.current || !enabled) {
      return;
    }

    const restoreData = () => {
      try {
        const autosavedJson = localStorage.getItem(storageKey);
        if (autosavedJson) {
          const parsed = JSON.parse(autosavedJson);
          const savedTime = new Date(parsed.timestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);

          // Restore if data is less than 24 hours old
          if (hoursDiff < 24) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { timestamp, ...restoredValues } = parsed;
            onRestore(restoredValues as T);
            setLastSaved(savedTime);
            lastSavedValuesRef.current = restoredValues as T;
            toast.info('Draft restored from autosave.');
          } else {
            // Clear expired data
            localStorage.removeItem(storageKey);
          }
        }
      } catch (error) {
        console.error('Failed to load autosaved data:', error);
        localStorage.removeItem(storageKey); // Clear corrupted data
      } finally {
        restoredRef.current = true;
      }
    };

    restoreData();
  }, [storageKey, onRestore, enabled]);

  const clearAutosavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setLastSaved(null);
      setHasUnsavedChanges(false);
      lastSavedValuesRef.current = null;
    } catch (error) {
      console.error('Failed to clear autosaved data:', error);
    }
  }, [storageKey]);

  return { 
    status, 
    lastSaved, 
    hasUnsavedChanges, 
    saveNow, 
    clearAutosavedData 
  };
}