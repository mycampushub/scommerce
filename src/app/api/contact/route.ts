import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { getEnv } from '@/lib/cloudflare'
import { execute } from '@/db/db'
import { rateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limit'

/**
 * POST /api/contact - Handle contact form submissions
 */
export async function POST(request: NextRequest) {
  const env = await getEnv()

  // SECURITY: Rate limiting to prevent spam/abuse (5 requests per hour per IP)
  const clientIp = getClientIp(request)
  const rateLimitKey = `contact-form:${clientIp}`
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour window
  })

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
  }

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
      return validationErrorResponse('All required fields must be filled')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return validationErrorResponse('Invalid email format')
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

    return successResponse(
      { message: 'Your message has been sent successfully! We will get back to you within 24 hours.' },
      'Contact form submitted successfully'
    )
  } catch (error) {
    console.error('Error submitting contact form:', error)
    return errorResponse('Failed to submit contact form', 500)
  }
}
