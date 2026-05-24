/**
 * Custom Hook: useMemoizedCallback
 * Alternative to useCallback with dependencies tracking
 */

import { useCallback, useRef } from 'react'

export function useMemoizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  const ref = useRef(callback)

  // Update ref when callback or dependencies change
  ref.current = useCallback(callback, deps) as T

  // Return the current ref value
  return ref.current
}
