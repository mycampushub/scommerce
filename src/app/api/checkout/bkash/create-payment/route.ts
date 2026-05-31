import { NextRequest, NextResponse } from 'next/server'

const BKASH_BASE_URL = process.env.BKASH_SANDBOX === 'true'
  ? 'https://checkout.sandbox.bka.sh/v1.2.0-beta'
  : 'https://checkout.pay.bka.sh/v1.2.0-beta'

interface BkashPaymentRequest {
  amount: number
  orderId: string
  customerName: string
  customerEmail?: string
  customerPhone: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BkashPaymentRequest = await request.json()
    const { amount, orderId, customerName, customerEmail, customerPhone } = body

    if (!amount || !orderId || !customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const authResponse = await fetch(`${BKASH_BASE_URL}/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'username': process.env.BKASH_USERNAME || '',
        'password': process.env.BKASH_PASSWORD || ''
      }
    })

    if (!authResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to authenticate with Bkash' },
        { status: 500 }
      )
    }

    const authData = await authResponse.json()
    const token = authData.id_token

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Failed to get Bkash token' },
        { status: 500 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const callbackURL = `${siteUrl}/api/checkout/bkash/callback`
    
    const paymentResponse = await fetch(`${BKASH_BASE_URL}/checkout/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token,
        'X-APP-Key': process.env.BKASH_APP_KEY || ''
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: orderId,
        callbackURL: `${callbackURL}?orderId=${orderId}`
      })
    })

    if (!paymentResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to create Bkash payment' },
        { status: 500 }
      )
    }

    const paymentData = await paymentResponse.json()

    return NextResponse.json({
      success: true,
      data: {
        bkashURL: paymentData.bkashURL,
        paymentID: paymentData.paymentID,
        amount,
        orderId
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Payment creation failed' },
      { status: 500 }
    )
  }
}
