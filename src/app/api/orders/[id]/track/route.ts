import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { OrderRepository } from '@/db/order.repository'
import { parseJSON } from '@/db/db'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'

interface TrackingEvent {
  status: string
  description: string
  date: string | null
  location?: string | null
  completed: boolean
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = await getEnv()

  // ============================================
  // AUTHENTICATION - REQUIRED FOR ORDER TRACKING
  // ============================================
  
  // Get authentication token
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('session')?.value
  const token = extractTokenFromHeader(authHeader) || cookieToken

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required to track orders' },
      { status: 401 }
    )
  }

  // Verify token and get user info
  const payload = await verifyToken(token)
  if (!payload || !payload.userId) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired authentication token' },
      { status: 401 }
    )
  }

  const authenticatedUserId = payload.userId
  const authenticatedEmail = payload.email
  const isAdmin = payload.role === 'admin' || payload.role === 'staff'

  try {
    const orderId = (await params).id

    // Fetch order with order items
    const order = await OrderRepository.findById(env, orderId)

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      )
    }

    // ============================================
    // AUTHORIZATION - VERIFY ORDER OWNERSHIP
    // ============================================
    
    // Users can only view their own orders; admins can view any order
    if (!isAdmin) {
      const isOwner = order.userId === authenticatedUserId || order.customerEmail === authenticatedEmail
      if (!isOwner) {
        return NextResponse.json(
          {
            success: false,
            error: 'Order not found or access denied',
          },
          { status: 404 } // Return 404 to hide existence of other orders
        )
      }
    }

    // Fetch order items
    const orderItems = await OrderRepository.getItems(env, orderId)

    // Parse shipping address
    const shippingAddress = order.shippingAddress ? parseJSON(order.shippingAddress) : null

    // Generate tracking timeline based on order status and timeline
    const trackingTimeline = generateTrackingTimeline(order)

    // ============================================
    // DATA EXPOSURE PREVENTION
    // - Mask email for non-admins
    // - Remove phone number entirely (not needed for tracking)
    // ============================================
    const maskEmail = (email: string | null | undefined): string | null => {
      if (!email) return null
      if (isAdmin) return email // Admins see full email
      
      const [local, domain] = email.split('@')
      if (!local || !domain) return email
      
      // Mask all but first 2 characters of local part
      const maskedLocal = local.length > 2 
        ? local.substring(0, 2) + '*'.repeat(local.length - 2)
        : '**'
      return `${maskedLocal}@${domain}`
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          trackingStatus: order.trackingStatus,
          trackingNumber: order.trackingNumber,
          estimatedDeliveryDate: order.estimatedDeliveryDate,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
        customer: {
          name: order.customerName,
          email: maskEmail(order.customerEmail),
          // Phone number removed - not needed for tracking
        },
        shipping: {
          address: shippingAddress,
          city: order.city,
          district: order.district,
          division: order.division,
        },
        tracking: {
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingNumber
            ? `https://trackcourier.com/track/${order.trackingNumber}`
            : null,
          courier: 'Local Courier',
          timeline: trackingTimeline,
        },
        items: orderItems.map((item) => ({
          id: item.id,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching order tracking:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tracking information',
      },
      { status: 500 }
    )
  }
}

/**
 * Generate tracking timeline based on order status and dates
 */
function generateTrackingTimeline(order: any): TrackingEvent[] {
  const createdAt = new Date(order.createdAt)
  const timeline: TrackingEvent[] = [
    {
      status: 'ORDER_PLACED',
      description: 'Order has been placed successfully',
      date: order.createdAt,
      location: null,
      completed: true,
    },
  ]

  // Determine shipping timeline based on division
  const estimatedDays = getEstimatedDeliveryDays(order.division)

  // Add confirmation step (usually within 30 minutes)
  if (order.status !== 'PENDING' && order.status !== 'CANCELLED') {
    const confirmedDate = new Date(createdAt.getTime() + 30 * 60 * 1000)
    timeline.push({
      status: 'ORDER_CONFIRMED',
      description: 'Order confirmed and processing started',
      date: confirmedDate.toISOString(),
      location: 'Processing Center',
      completed: true,
    })
  } else {
    timeline.push({
      status: 'ORDER_CONFIRMED',
      description: 'Order confirmation pending',
      date: null,
      location: null,
      completed: false,
    })
  }

  // Add processing step (usually 1-2 hours)
  if (['PROCESSING', 'SHIPPED', 'DELIVERED', 'REFUNDED'].includes(order.status)) {
    const processingDate = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000)
    timeline.push({
      status: 'PROCESSING',
      description: 'Order is being packed and prepared for shipment',
      date: processingDate.toISOString(),
      location: 'Processing Center',
      completed: true,
    })
  } else {
    timeline.push({
      status: 'PROCESSING',
      description: 'Processing pending',
      date: null,
      location: null,
      completed: false,
    })
  }

  // Add shipped step (usually 1-2 days after processing)
  if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
    const shippedDate = order.estimatedDeliveryDate
      ? new Date(new Date(order.estimatedDeliveryDate).getTime() - (estimatedDays - 1) * 24 * 60 * 60 * 1000)
      : new Date(createdAt.getTime() + 1 * 24 * 60 * 60 * 1000)

    const trackingStatusDescriptions: Record<string, string> = {
      PENDING: 'Package awaiting pickup from courier',
      IN_TRANSIT: 'Package in transit to destination',
      OUT_FOR_DELIVERY: 'Package out for delivery',
      DELIVERED: 'Package delivered',
    }

    timeline.push({
      status: 'SHIPPED',
      description: trackingStatusDescriptions[order.trackingStatus] || 'Package shipped',
      date: shippedDate.toISOString(),
      location: order.division || 'Transit Hub',
      completed: true,
    })

    // Add detailed tracking steps based on tracking status
    if (order.trackingStatus === 'IN_TRANSIT') {
      const inTransitDate = new Date(shippedDate.getTime() + 12 * 60 * 60 * 1000) // +12 hours
      timeline.push({
        status: 'IN_TRANSIT',
        description: 'Package is in transit to delivery location',
        date: inTransitDate.toISOString(),
        location: `${order.district || 'Local'}, ${order.division}`,
        completed: true,
      })
    }

    if (order.trackingStatus === 'OUT_FOR_DELIVERY') {
      const outForDeliveryDate = new Date(shippedDate.getTime() + 24 * 60 * 60 * 1000) // +1 day
      timeline.push({
        status: 'OUT_FOR_DELIVERY',
        description: 'Package is out for delivery',
        date: outForDeliveryDate.toISOString(),
        location: `${order.city || 'Delivery Area'}`,
        completed: true,
      })
    }
  } else if (order.status === 'CANCELLED') {
    timeline.push({
      status: 'CANCELLED',
      description: `Order cancelled${order.cancellationReason ? ': ' + order.cancellationReason : ''}`,
      date: order.cancelledAt || null,
      location: null,
      completed: true,
    })
  } else {
    timeline.push({
      status: 'SHIPPED',
      description: order.status === 'CANCELLED'
        ? 'Order cancelled before shipment'
        : 'Awaiting shipment',
      date: null,
      location: null,
      completed: false,
    })
  }

  // Add delivered step
  if (order.status === 'DELIVERED') {
    const deliveredDate = order.estimatedDeliveryDate || new Date().toISOString()
    timeline.push({
      status: 'DELIVERED',
      description: 'Package delivered successfully',
      date: deliveredDate,
      location: order.city || 'Delivery Location',
      completed: true,
    })
  } else {
    timeline.push({
      status: 'DELIVERED',
      description: order.status === 'CANCELLED'
        ? 'Order cancelled'
        : `Expected delivery by ${order.estimatedDeliveryDate
          ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-BD', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : 'Estimated delivery pending'}`,
      date: order.estimatedDeliveryDate || null,
      location: null,
      completed: order.status === 'DELIVERED',
    })
  }

  return timeline
}

/**
 * Get estimated delivery days based on division in Bangladesh
 */
function getEstimatedDeliveryDays(division: string): number {
  // Major cities: 2-3 days, other areas: 3-5 days
  const majorCities = ['Dhaka', 'Chittagong', 'Sylhet', 'Khulna', 'Rajshahi', 'Barisal']

  if (division && majorCities.includes(division)) {
    return 3 // 2-3 days
  }

  return 4 // 3-4 days for other areas
}
