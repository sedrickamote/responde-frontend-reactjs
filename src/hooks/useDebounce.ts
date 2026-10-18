import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any value by a given delay in milliseconds.
 * Useful for text inputs, multi-select filters, and date picker changes.
 *
 * @param value The value to debounce
 * @param delay Delay in milliseconds (default 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
