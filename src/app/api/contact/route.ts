import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { execute } from '@/db/db'

/**
 * POST /api/contact - Handle contact form submissions
 */
export async function POST(request: NextRequest) {
  const env = getEnv()

  try {
    const body = await request.json() as {
      name: string;
      email: string;
      phone?: string;
      subject: string;
      message: string;
    }

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be filled' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Store contact submission in database
    const id = `contact_${Date.now()}`
    const currentTime = new Date().toISOString()

    await execute(
      env,
      `INSERT INTO contact_submissions (id, name, email, phone, subject, message, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      body.name,
      body.email,
      body.phone || null,
      body.subject,
      body.message,
      currentTime
    )

    // In a real application, you would also:
    // 1. Send email notification to admin
    // 2. Send auto-reply to customer
    // For now, we'll just store the submission

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you within 24 hours.'
    })
  } catch (error) {
    console.error('Error submitting contact form:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit contact form' },
      { status: 500 }
    )
  }
}
