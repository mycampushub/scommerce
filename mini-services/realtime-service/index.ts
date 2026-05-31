/**
 * Real-Time WebSocket Service for SCommerce
 * Handles inventory updates, order status changes, and admin notifications
 * Runs on port 3004
 */

import { createServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

const PORT = 3004
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'

// Create HTTP server
const httpServer = createServer()

// Create Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

// Store connected clients
const connectedClients = new Map<string, Set<string>>()

/**
 * Broadcast inventory update to all clients watching a product
 */
export function broadcastInventoryUpdate(productId: string, data: {
  stock: number
  variantId?: string
  lowStockAlert?: boolean
}) {
  io.to(`product-${productId}`).emit('inventory-update', {
    type: 'inventory',
    productId,
    ...data,
    timestamp: new Date().toISOString()
  })

  // Send low stock alert to admin
  if (data.lowStockAlert || data.stock <= 10) {
    io.to('admin').emit('low-stock-alert', {
      productId,
      stock: data.stock,
      variantId: data.variantId,
      timestamp: new Date().toISOString()
    })
  }

  console.log(`[Realtime] Inventory update broadcast for product ${productId}: ${data.stock} units`)
}

/**
 * Broadcast order status update to customer
 */
export function broadcastOrderStatus(orderId: string, data: {
  status: string
  trackingNumber?: string
  estimatedDeliveryDate?: string
}) {
  io.to(`order-${orderId}`).emit('order-status', {
    type: 'order-status',
    orderId,
    ...data,
    timestamp: new Date().toISOString()
  })

  console.log(`[Realtime] Order status update for order ${orderId}: ${data.status}`)
}

/**
 * Broadcast new order notification to admin
 */
export function broadcastNewOrder(orderData: {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  total: number
  items: any[]
}) {
  io.to('admin').emit('new-order', {
    type: 'new-order',
    ...orderData,
    timestamp: new Date().toISOString()
  })

  console.log(`[Realtime] New order notification: ${orderData.orderNumber}`)
}

/**
 * Broadcast cart sync across user sessions
 */
export function broadcastCartSync(userId: string, cartData: {
  items: any[]
  itemCount: number
  subtotal: number
}) {
  io.to(`user-${userId}`).emit('cart-sync', {
    type: 'cart-sync',
    userId,
    ...cartData,
    timestamp: new Date().toISOString()
  })

  console.log(`[Realtime] Cart synced for user ${userId}: ${cartData.itemCount} items`)
}

/**
 * Broadcast wishlist updates
 */
export function broadcastWishlistUpdate(userId: string, data: {
  productId: string
  action: 'add' | 'remove'
}) {
  io.to(`user-${userId}`).emit('wishlist-update', {
    type: 'wishlist',
    userId,
    ...data,
    timestamp: new Date().toISOString()
  })
}

/**
 * Broadcast live sales stats to admin dashboard
 */
export function broadcastSalesUpdate(salesData: {
  revenue: number
  ordersCount: number
  period: string
}) {
  io.to('admin').emit('sales-update', {
    type: 'sales',
    ...salesData,
    timestamp: new Date().toISOString()
  })
}

/**
 * Broadcast product update (price, availability, etc.)
 */
export function broadcastProductUpdate(productId: string, data: {
  price?: number
  isActive?: number
  discount?: number
}) {
  io.to(`product-${productId}`).emit('product-update', {
    type: 'product',
    productId,
    ...data,
    timestamp: new Date().toISOString()
  })

  console.log(`[Realtime] Product update for ${productId}`)
}

/**
 * Broadcast message to specific room
 */
export function broadcastToRoom(room: string, event: string, data: any) {
  io.to(room).emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  })
}

/**
 * Connection handler
 */
io.on('connection', (socket: Socket) => {
  const clientInfo = {
    id: socket.id,
    ip: socket.handshake.address,
    connectedAt: new Date().toISOString()
  }

  console.log(`[Realtime] Client connected:`, clientInfo)

  // Join product room to watch inventory
  socket.on('join-product', (productId: string) => {
    socket.join(`product-${productId}`)
    console.log(`[Realtime] Socket ${socket.id} joined product-${productId}`)
  })

  // Leave product room
  socket.on('leave-product', (productId: string) => {
    socket.leave(`product-${productId}`)
    console.log(`[Realtime] Socket ${socket.id} left product-${productId}`)
  })

  // Join order room to watch status updates
  socket.on('join-order', (orderId: string) => {
    socket.join(`order-${orderId}`)
    console.log(`[Realtime] Socket ${socket.id} joined order-${orderId}`)
  })

  // Leave order room
  socket.on('leave-order', (orderId: string) => {
    socket.leave(`order-${orderId}`)
  })

  // Join user room for cart/wishlist sync
  socket.on('join-user', (userId: string) => {
    socket.join(`user-${userId}`)
    console.log(`[Realtime] Socket ${socket.id} joined user-${userId}`)
  })

  // Leave user room
  socket.on('leave-user', (userId: string) => {
    socket.leave(`user-${userId}`)
  })

  // Join admin room for notifications
  socket.on('join-admin', () => {
    socket.join('admin')
    console.log(`[Realtime] Socket ${socket.id} joined admin room`)
  })

  // Leave admin room
  socket.on('leave-admin', () => {
    socket.leave('admin')
  })

  // Heartbeat/ping-pong for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() })
  })

  // Handle errors
  socket.on('error', (error) => {
    console.error(`[Realtime] Socket error for ${socket.id}:`, error)
  })

  // Disconnect handler
  socket.on('disconnect', (reason) => {
    console.log(`[Realtime] Client disconnected:`, socket.id, reason)
  })
})

// Error handling
io.on('error', (error) => {
  console.error('[Realtime] Socket.IO error:', error)
})

// Start server
httpServer.listen(PORT, () => {
  console.log(`╔════════════════════════════════════════════════════════╗`)
  console.log(`║  Real-Time WebSocket Service                        ║`)
  console.log(`║  🚀 Server running on port ${PORT}                            ║`)
  console.log(`║  📍 URL: http://localhost:${PORT}                           ║`)
  console.log(`╚════════════════════════════════════════════════════════╝`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Realtime] SIGTERM received, shutting down gracefully...')
  httpServer.close(() => {
    console.log('[Realtime] HTTP server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[Realtime] SIGINT received, shutting down gracefully...')
  httpServer.close(() => {
    console.log('[Realtime] HTTP server closed')
    process.exit(0)
  })
})

// Export functions for external use
export const realtimeFunctions = {
  broadcastInventoryUpdate,
  broadcastOrderStatus,
  broadcastNewOrder,
  broadcastCartSync,
  broadcastWishlistUpdate,
  broadcastSalesUpdate,
  broadcastProductUpdate,
  broadcastToRoom
}

// Attach to global for cross-service communication
;(global as any).realtimeFunctions = realtimeFunctions