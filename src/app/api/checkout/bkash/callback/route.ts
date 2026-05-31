import { NextRequest, NextResponse } from 'next/server'

const BKASH_BASE_URL = process.env.BKASH_SANDBOX === 'true'
  ? 'https://checkout.sandbox.bka.sh/v1.2.0-beta'
  : 'https://checkout.pay.bka.sh/v1.2.0-beta'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')
  const paymentID = searchParams.get('paymentID')
  const status = searchParams.get('status')

  try {
    // Get OAuth Token
    const authResponse = await fetch(`${BKASH_BASE_URL}/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'username': process.env.BKASH_USERNAME || '',
        'password': process.env.BKASH_PASSWORD || ''
      }
    })

    const authData = await authResponse.json()
    const token = authData.id_token

    if (!token) {
      return NextResponse.redirect(
        new URL(`/checkout?status=error&message=auth_failed`, request.url)
      )
    }

    // Execute payment if success
    if (status === 'success' && paymentID) {
      const executeResponse = await fetch(`${BKASH_BASE_URL}/checkout/payment/execute/${paymentID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token,
          'X-APP-Key': process.env.BKASH_APP_KEY || ''
        }
      })

      const executeData = await executeResponse.json()

      if (executeData.statusCode === '0000') {
        // Payment successful - redirect to success page
        return NextResponse.redirect(
          new URL(`/order-confirmation?orderId=${orderId}&paymentMethod=bkash`, request.url)
        )
      } else {
        // Payment failed
        return NextResponse.redirect(
          new URL(`/checkout?status=error&message=${encodeURIComponent(executeData.statusMessage || 'Payment failed')}`, request.url)
        )
      }
    } else if (status === 'cancel') {
      return NextResponse.redirect(
        new URL(`/checkout?status=cancelled`, request.url)
      )
    } else if (status === 'failure') {
      return NextResponse.redirect(
        new URL(`/checkout?status=error&message=Payment failed`, request.url)
      )
    }

    return NextResponse.redirect(
      new URL(`/checkout?status=error&message=Unknown error`, request.url)
    )
  } catch (error: any) {
    return NextResponse.redirect(
      new URL(`/checkout?status=error&message=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}
