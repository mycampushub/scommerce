'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Smartphone } from 'lucide-react'
import { useBkashPayment } from '@/hooks/use-bkash-payment'
import { toast } from 'sonner'

interface BkashPaymentButtonProps {
  amount: number
  orderId: string
  customerName: string
  customerEmail?: string
  customerPhone: string
  onPaymentSuccess?: (data: any) => void
  onPaymentError?: (error: string) => void
  onPaymentCancel?: () => void
  disabled?: boolean
  className?: string
}

export function BkashPaymentButton({
  amount,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
  disabled = false,
  className = ''
}: BkashPaymentButtonProps) {
  const { createPayment, loading, error } = useBkashPayment()
  const [processing, setProcessing] = useState(false)

  const handleBkashPayment = async () => {
    if (processing || disabled) return

    // Validate phone number
    if (!customerPhone || !/^01[3-9]\d{8}$/.test(customerPhone)) {
      toast.error('Please enter a valid Bkash mobile number (01XXXXXXXXX)')
      onPaymentError?.('Invalid phone number')
      return
    }

    setProcessing(true)

    await createPayment({
      amount,
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      onSuccess: (data) => {
        toast.success('Bkash payment initiated. Complete the payment in the popup.')
        onPaymentSuccess?.(data)
        setProcessing(false)
      },
      onError: (err) => {
        toast.error(err)
        onPaymentError?.(err)
        setProcessing(false)
      },
      onCancel: () => {
        toast.info('Payment cancelled')
        onPaymentCancel?.()
        setProcessing(false)
      }
    })
  }

  return (
    <Button
      onClick={handleBkashPayment}
      disabled={disabled || loading || processing}
      className={`w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold ${className}`}
      size="lg"
    >
      {(loading || processing) ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Smartphone className="w-4 h-4 mr-2" />
          Pay with Bkash
        </>
      )}
    </Button>
  )
}
