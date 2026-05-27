import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * Matches frontend hooks/use-debounce.tsx patterns
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} The debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for debounced callback
 * 
 * @param {Function} callback - The callback to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} The debounced callback
 */
export const useDebouncedCallback = (callback, delay = 500) => {
  const [timer, setTimer] = useState(null);

  const debouncedCallback = (...args) => {
    if (timer) {
      clearTimeout(timer);
    }
    
    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);
    
    setTimer(newTimer);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  return debouncedCallback;
};

export default useDebounce;