import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debounced auto-saving with status tracking.
 *
 * @param {Object} options
 * @param {any} options.data - The data object to observe and auto-save.
 * @param {Function} options.onSave - Async callback to perform saving.
 * @param {number} [options.delay=1200] - Debounce delay in milliseconds.
 * @param {boolean} [options.enabled=true] - Whether auto-saving is active.
 * @returns {Object} AutoSave state and controls.
 */
export function useAutoSave({ data, onSave, delay = 1200, enabled = true }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [error, setError] = useState(null);

  const lastSavedDataRef = useRef(null);
  const timeoutRef = useRef(null);
  const isFirstMountRef = useRef(true);

  // Initialize reference data without triggering a save on mount
  useEffect(() => {
    if (isFirstMountRef.current && data) {
      lastSavedDataRef.current = JSON.stringify(data);
      isFirstMountRef.current = false;
    }
  }, [data]);

  const executeSave = useCallback(
    async (saveData) => {
      if (!saveData || !onSave) return;
      setStatus('saving');
      setError(null);

      try {
        await onSave(saveData);
        lastSavedDataRef.current = JSON.stringify(saveData);
        setStatus('saved');
        setLastSavedTime(new Date());
      } catch (err) {
        console.error('AutoSave failed:', err);
        setError(err);
        setStatus('error');
      }
    },
    [onSave]
  );

  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (data) {
      return executeSave(data);
    }
  }, [data, executeSave]);

  useEffect(() => {
    if (!enabled || !data) return;

    const currentSerialized = JSON.stringify(data);
    if (currentSerialized === lastSavedDataRef.current) {
      return;
    }

    setStatus('unsaved');

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      executeSave(data);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, executeSave]);

  const markSaved = useCallback(
    (customTime = new Date()) => {
      if (data) {
        lastSavedDataRef.current = JSON.stringify(data);
      }
      setStatus('saved');
      setLastSavedTime(customTime);
    },
    [data]
  );

  const resetStatus = useCallback(() => {
    setStatus('idle');
    setError(null);
    lastSavedDataRef.current = null;
    isFirstMountRef.current = true;
  }, []);

  return {
    status,
    lastSavedTime,
    error,
    saveNow,
    markSaved,
    resetStatus,
    isSaving: status === 'saving',
    isSaved: status === 'saved',
    isError: status === 'error',
    isUnsaved: status === 'unsaved',
  };
}
