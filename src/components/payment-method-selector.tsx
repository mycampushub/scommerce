'use client'

import { useState } from 'react'
import { CreditCard, Smartphone, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BkashPaymentButton } from './bkash-payment-button'

export type PaymentMethod = 'card' | 'bkash' | 'cod'

interface PaymentMethodSelectorProps {
  amount: number
  orderId: string
  customerName: string
  customerEmail?: string
  customerPhone: string
  onPaymentSuccess?: (data: any) => void
  onPaymentError?: (error: string) => void
  onPaymentCancel?: () => void
}

export function PaymentMethodSelector({
  amount,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cod')

  const handlePaymentSuccess = (data: any) => {
    onPaymentSuccess?.(data)
  }

  const handlePaymentError = (error: string) => {
    onPaymentError?.(error)
  }

  const handlePaymentCancel = () => {
    onPaymentCancel?.()
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Select Payment Method</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bkash */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedMethod === 'bkash'
              ? 'border-pink-600 ring-2 ring-pink-600 ring-offset-2'
              : 'border-gray-200 hover:border-pink-300'
          }`}
          onClick={() => setSelectedMethod('bkash')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="font-medium">Bkash</p>
              <p className="text-xs text-gray-500">Mobile Banking</p>
            </div>
          </CardContent>
        </Card>

        {/* Card Payment */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedMethod === 'card'
              ? 'border-pink-600 ring-2 ring-pink-600 ring-offset-2'
              : 'border-gray-200 hover:border-pink-300'
          }`}
          onClick={() => setSelectedMethod('card')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Card Payment</p>
              <p className="text-xs text-gray-500">Credit/Debit Card</p>
            </div>
          </CardContent>
        </Card>

        {/* Cash on Delivery */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedMethod === 'cod'
              ? 'border-pink-600 ring-2 ring-pink-600 ring-offset-2'
              : 'border-gray-200 hover:border-pink-300'
          }`}
          onClick={() => setSelectedMethod('cod')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Cash on Delivery</p>
              <p className="text-xs text-gray-500">Pay when you receive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Button */}
      <div className="mt-6">
        {selectedMethod === 'bkash' && (
          <BkashPaymentButton
            amount={amount}
            orderId={orderId}
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onPaymentCancel={handlePaymentCancel}
          />
        )}

        {selectedMethod === 'card' && (
          <Button
            disabled
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            size="lg"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Pay with Card (Coming Soon)
          </Button>
        )}

        {selectedMethod === 'cod' && (
          <Button
            onClick={() => onPaymentSuccess?.({ method: 'cod' })}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            size="lg"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Place Order (Cash on Delivery)
          </Button>
        )}
      </div>
    </div>
  )
}
