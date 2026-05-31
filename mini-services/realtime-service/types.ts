/**
 * Type definitions for Real-Time WebSocket Service
 */

export interface InventoryUpdateData {
  stock: number
  variantId?: string
  lowStockAlert?: boolean
}

export interface OrderStatusData {
  status: string
  trackingNumber?: string
  estimatedDeliveryDate?: string
}

export interface NewOrderData {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  total: number
  items: any[]
}

export interface CartSyncData {
  items: any[]
  itemCount: number
  subtotal: number
}

export interface WishlistUpdateData {
  productId: string
  action: 'add' | 'remove'
}

export interface SalesUpdateData {
  revenue: number
  ordersCount: number
  period: string
}

export interface ProductUpdateData {
  price?: number
  isActive?: number
  discount?: number
}

export interface RealtimeMessage<T = any> {
  type: string
  timestamp: string
  [key: string]: any
}

export interface SocketClientInfo {
  id: string
  ip: string
  connectedAt: string
}

export type BroadcastFunction = (data: any) => void

export interface RealtimeFunctions {
  broadcastInventoryUpdate: (productId: string, data: InventoryUpdateData) => void
  broadcastOrderStatus: (orderId: string, data: OrderStatusData) => void
  broadcastNewOrder: (orderData: NewOrderData) => void
  broadcastCartSync: (userId: string, cartData: CartSyncData) => void
  broadcastWishlistUpdate: (userId: string, data: WishlistUpdateData) => void
  broadcastSalesUpdate: (salesData: SalesUpdateData) => void
  broadcastProductUpdate: (productId: string, data: ProductUpdateData) => void
  broadcastToRoom: (room: string, event: string, data: any) => void
}