'use client'

import { useEffect, useRef } from 'react'

export function useFocusTrap() {
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const focusableElementsRef = useRef<HTMLElement[]>([])
  const firstFocusableRef = useRef<HTMLElement | null>(null)
  const lastFocusableRef = useRef<HTMLElement | null>(null)

  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ]
    return Array.from(container.querySelectorAll(focusableSelectors.join(', '))).filter(
      (el): el is HTMLElement => {
        const htmlEl = el as HTMLElement
        return htmlEl.offsetParent !== null || htmlEl.getClientRects().length > 0
      }
    )
  }

  const activate = (container: HTMLElement) => {
    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Get all focusable elements inside the container
    focusableElementsRef.current = getFocusableElements(container)

    if (focusableElementsRef.current.length > 0) {
      firstFocusableRef.current = focusableElementsRef.current[0]
      lastFocusableRef.current = focusableElementsRef.current[focusableElementsRef.current.length - 1]

      // Focus the first element
      firstFocusableRef.current.focus()
    }
  }

  const deactivate = () => {
    // Restore focus to the previously focused element
    if (previousActiveElement.current) {
      previousActiveElement.current.focus()
    }
  }

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (!firstFocusableRef.current || !lastFocusableRef.current) return

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusableRef.current) {
        e.preventDefault()
        lastFocusableRef.current.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusableRef.current) {
        e.preventDefault()
        firstFocusableRef.current.focus()
      }
    }
  }

  return {
    activate,
    deactivate,
    handleTabKey,
  }
}
