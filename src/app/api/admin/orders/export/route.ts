import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { queryAll } from '@/db/db'

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = await getEnv()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''

  // Fetch orders
  let query = 'SELECT * FROM orders'
  let params: any[] = []

  if (status) {
    query += ' WHERE status = ?'
    params.push(status)
  }

  query += ' ORDER BY createdAt DESC'

  const orders = await queryAll(env, query, ...params)

  // Fetch all order items for these orders
  const orderIds = orders.map((o: any) => o.id)
  let orderItems: any[] = []
  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => '?').join(',')
    orderItems = await queryAll(
      env,
      `SELECT * FROM order_items WHERE orderId IN (${placeholders})`,
      ...orderIds
    )
  }

  // Group order items by orderId
  const itemsByOrderId = new Map<string, any[]>()
  for (const item of orderItems) {
    if (!itemsByOrderId.has(item.orderId)) {
      itemsByOrderId.set(item.orderId, [])
    }
    itemsByOrderId.get(item.orderId)!.push(item)
  }

  // Helper function to escape CSV fields
  const escapeCSV = (field: any): string => {
    if (field === null || field === undefined) {
      return ''
    }
    const str = String(field)
    // If the field contains quotes, commas, or newlines, wrap in quotes and escape existing quotes
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // CSV Headers
  const headers = [
    'Order Number',
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Order Date',
    'Status',
    'Payment Status',
    'Payment Method',
    'Subtotal',
    'Shipping',
    'Tax',
    'Discount',
    'Total',
    'Tracking Number',
    'Tracking Status',
    'Estimated Delivery Date',
    'Notes',
    'Order Items'
  ]

  // Format order items for CSV
  const formatOrderItems = (items: any[]): string => {
    if (!items || items.length === 0) return ''
    return items
      .map((item: any) => `${item.productName} (x${item.quantity}) - $${item.price}`)
      .join('; ')
  }

  // Format date to ISO 8601
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toISOString()
    } catch {
      return ''
    }
  }

  // Format currency
  const formatCurrency = (value: number | null): string => {
    if (value === null || value === undefined) return '0.00'
    return value.toFixed(2)
  }

  // Generate CSV rows
  const rows = orders.map((order: any) => [
    escapeCSV(order.orderNumber),
    escapeCSV(order.customerName),
    escapeCSV(order.customerEmail),
    escapeCSV(order.customerPhone || ''),
    formatDate(order.createdAt),
    escapeCSV(order.status),
    escapeCSV(order.paymentStatus),
    escapeCSV(order.paymentMethod || ''),
    formatCurrency(order.subtotal),
    formatCurrency(order.shipping),
    formatCurrency(order.tax),
    formatCurrency(order.discount),
    formatCurrency(order.total),
    escapeCSV(order.trackingNumber || ''),
    escapeCSV(order.trackingStatus || ''),
    formatDate(order.estimatedDeliveryDate || ''),
    escapeCSV(order.notes || ''),
    escapeCSV(formatOrderItems(itemsByOrderId.get(order.id) || []))
  ])

  // Combine headers and rows
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Return CSV with proper headers
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
