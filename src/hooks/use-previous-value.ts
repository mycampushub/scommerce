/**
 * Custom Hook: usePreviousValue
 * Get the previous value of a state or prop
 */

import { useEffect, useRef } from 'react'

export function usePreviousValue<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}
