'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function ResetPasswordTokenHandler({ onToken }: { onToken: (token: string) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlToken = searchParams.get('token')
    if (urlToken) {
      onToken(urlToken)
    }
  }, [searchParams, onToken])

  return null
}
