'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Extracts the reset token from URL and stores it in global variable
 * This allows the ResetPasswordPage to access the token
 */
export default function ResetPasswordTokenHandler() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlToken = searchParams.get('token')
    if (urlToken) {
      // Store token in global variable for the page component to access
      (window as any).__RESET_PASSWORD_TOKEN__ = urlToken
    }
  }, [searchParams])

  return null
}
