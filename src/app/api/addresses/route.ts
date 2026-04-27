import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, queryFirst, execute, boolToNumber, numberToBool, generateId, now } from '@/db/db'
import { csrfMiddleware } from '@/lib/csrf'
import { sanitizeAddressData, sanitizeForDB, sanitizePhone } from '@/lib/sanitize'

export const runtime = 'edge';

/**
 * GET /api/addresses - Get all saved addresses for authenticated user
 */
export async function GET(request: NextRequest) {
  // Get D1 database from request context
  const env = getEnv(request)

  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const addresses = await queryAll(
      env,
      'SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, createdAt DESC',
      payload.userId
    )

    // Transform addresses to convert boolean fields
    const transformedAddresses = addresses.map((addr: any) => ({
      ...addr,
      isDefault: numberToBool(addr.isDefault),
    }))

    return NextResponse.json({
      success: true,
      data: transformedAddresses,
      count: transformedAddresses.length,
    })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/addresses - Create a new saved address
 */
export async function POST(request: NextRequest) {
  // Get D1 database from request context
  const env = getEnv(request)

  // Check CSRF protection
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Sanitize input
    const sanitizedBody = {
      ...body,
      fullName: sanitizeForDB(body.fullName),
      phone: sanitizePhone(body.phone),
      addressLine1: sanitizeForDB(body.addressLine1),
      addressLine2: body.addressLine2 ? sanitizeForDB(body.addressLine2) : null,
      city: sanitizeForDB(body.city),
      district: body.district ? sanitizeForDB(body.district) : null,
      division: sanitizeForDB(body.division),
      postalCode: body.postalCode ? sanitizeForDB(body.postalCode) : null,
    }

    // Validate required fields
    if (!sanitizedBody.fullName || !sanitizedBody.phone || !sanitizedBody.addressLine1 || !sanitizedBody.city || !sanitizedBody.division) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If this is set as default, unset any existing default address
    if (sanitizedBody.isDefault) {
      await execute(
        env,
        'UPDATE addresses SET isDefault = 0 WHERE userId = ? AND isDefault = 1',
        payload.userId
      )
    }

    // Create new address
    const id = generateId()
    const currentTime = now()

    await execute(
      env,
      `INSERT INTO addresses (id, userId, fullName, phone, addressLine1, addressLine2, city, district, division, postalCode, isDefault, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      payload.userId,
      sanitizedBody.fullName,
      sanitizedBody.phone,
      sanitizedBody.addressLine1,
      sanitizedBody.addressLine2 || null,
      sanitizedBody.city,
      sanitizedBody.district || null,
      sanitizedBody.division,
      sanitizedBody.postalCode || null,
      boolToNumber(sanitizedBody.isDefault || false),
      currentTime,
      currentTime
    )

    const address = await queryFirst(
      env,
      'SELECT * FROM addresses WHERE id = ? LIMIT 1',
      id
    )

    return NextResponse.json({
      success: true,
      data: address ? { ...address, isDefault: numberToBool(address.isDefault) } : null,
    })
  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create address' },
      { status: 500 }
    )
  }
}
