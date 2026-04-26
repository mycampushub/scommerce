'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook to avoid hydration mismatch by ensuring code only runs on client
 * This is especially useful when reading from localStorage or browser APIs
 * @returns boolean - true only after component has mounted on client
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  return hasMounted
}
