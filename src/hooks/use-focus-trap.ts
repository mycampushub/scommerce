'use client'

import { useEffect, useRef } from 'react'

interface UseFocusTrapOptions {
  isOpen: boolean
  autoFocus?: boolean
}

/**
 * Custom hook to trap focus within a modal or dialog
 * @param options - Configuration options
 * @returns Ref to attach to the modal container
 */
export function useFocusTrap<T extends HTMLElement>({
  isOpen,
  autoFocus = true,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      return
    }

    // Save the currently focused element (trigger)
    triggerRef.current = document.activeElement as HTMLElement

    const container = containerRef.current

    // Find all focusable elements within the container
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus the first focusable element when modal opens
    if (autoFocus && firstElement) {
      setTimeout(() => firstElement.focus(), 0)
    }

    // Handle Tab key to cycle through focusable elements
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        return
      }

      if (focusableElements.length === 0) {
        e.preventDefault()
        return
      }

      // Handle Shift+Tab (moving backwards)
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      }
      // Handle Tab (moving forwards)
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    // Return focus to trigger element when modal closes
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      if (triggerRef.current) {
        triggerRef.current.focus()
      }
    }
  }, [isOpen, autoFocus])

  return containerRef
}
