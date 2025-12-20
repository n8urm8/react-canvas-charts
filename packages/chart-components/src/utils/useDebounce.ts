import { useState, useEffect, useRef } from 'react'

/**
 * Hook that debounces a value change, delaying updates until the value stops changing
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds before updating (default: 150ms)
 * @param onDebouncedChange - Callback when debounced value changes
 * @returns The local value that updates immediately
 */
export function useDebounce<T>(
  value: T,
  delay: number = 150,
  onDebouncedChange?: (value: T) => void
): [T, (value: T) => void] {
  const [localValue, setLocalValue] = useState(value)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounced update
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (localValue !== value && onDebouncedChange) {
      debounceTimerRef.current = setTimeout(() => {
        onDebouncedChange(localValue)
      }, delay)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [localValue, value, delay, onDebouncedChange])

  return [localValue, setLocalValue]
}
