import { useState, useEffect } from 'react';

/**
 * Debounces a value — only updates after `delay` ms of inactivity.
 * Prevents API calls firing on every keystroke.
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
