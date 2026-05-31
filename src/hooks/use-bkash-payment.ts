'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface BkashPaymentOptions {
  amount: number
  orderId: string
  customerName: string
  customerEmail?: string
  customerPhone: string
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  onCancel?: () => void
}

export function useBkashPayment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPayment = async (options: BkashPaymentOptions) => {
    const { amount, orderId, customerName, customerEmail, customerPhone, onSuccess, onError, onCancel } = options
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout/bkash/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          orderId,
          customerName,
          customerEmail,
          customerPhone
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Payment creation failed')
      }

      // Open Bkash payment page
      const bkashWindow = window.open(data.data.bkashURL, '_blank', 'width=500,height=700')

      if (!bkashWindow) {
        throw new Error('Please enable popups to proceed with Bkash payment')
      }

      // Listen for payment completion (via callback URL)
      const checkPaymentInterval = setInterval(() => {
        if (bkashWindow.closed) {
          clearInterval(checkPaymentInterval)
          onCancel?.()
          setLoading(false)
        }
      }, 1000)

      // Stop checking after 10 minutes
      setTimeout(() => {
        clearInterval(checkPaymentInterval)
        if (!bkashWindow.closed) {
          bkashWindow.close()
        }
        setLoading(false)
      }, 600000)

      onSuccess?.(data.data)
    } catch (err: any) {
      const errorMessage = err.message || 'Payment initialization failed'
      setError(errorMessage)
      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    createPayment,
    loading,
    error
  }
}
