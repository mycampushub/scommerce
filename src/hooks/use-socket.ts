/**
 * Custom React Hook for Socket.IO Real-Time Connection
 * Provides socket connection management and event handling
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

export interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  connectionError: string | null
  joinProduct: (productId: string) => void
  leaveProduct: (productId: string) => void
  joinOrder: (orderId: string) => void
  leaveOrder: (orderId: string) => void
  joinUser: (userId: string) => void
  leaveUser: (userId: string) => void
  joinAdmin: () => void
  leaveAdmin: () => void
  onInventoryUpdate: (callback: (data: any) => void) => () => void
  onOrderStatus: (callback: (data: any) => void) => () => void
  onNewOrder: (callback: (data: any) => void) => () => void
  onCartSync: (callback: (data: any) => void) => () => void
  onSalesUpdate: (callback: (data: any) => void) => () => void
  onLowStockAlert: (callback: (data: any) => void) => () => void
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Store event callbacks using refs to avoid re-renders
  const callbacksRef = useRef({
    inventoryUpdate: [] as ((data: any) => void)[],
    orderStatus: [] as ((data: any) => void)[],
    newOrder: [] as ((data: any) => void)[],
    cartSync: [] as ((data: any) => void)[],
    salesUpdate: [] as ((data: any) => void)[],
    lowStockAlert: [] as ((data: any) => void)[]
  })

  // Initialize socket connection
  useEffect(() => {
    // Determine socket URL based on environment
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '/'

    const socketInstance = io(socketUrl, {
      path: '/',
      query: { XTransformPort: '3004' },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000
    })

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance.id)
      setIsConnected(true)
      setConnectionError(null)
      toast.success('Real-time connection established')
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
      setIsConnected(false)

      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        socketInstance.connect()
      }
    })

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error)
      setConnectionError(error.message)
      setIsConnected(false)
    })

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
      setConnectionError(null)
      toast.success('Real-time connection restored')
    })

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnection attempt:', attemptNumber)
    })

    socketInstance.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed')
      setConnectionError('Failed to reconnect')
      setIsConnected(false)
      toast.error('Real-time connection failed. Some features may not work properly.')
    })

    // Ping-pong for connection health
    socketInstance.on('pong', (data) => {
      const latency = Date.now() - new Date(data.timestamp).getTime()
      console.log('[Socket] Pong received, latency:', latency, 'ms')
    })

    // Set up event listeners
    socketInstance.on('inventory-update', (data) => {
      callbacksRef.current.inventoryUpdate.forEach(cb => cb(data))
    })

    socketInstance.on('order-status', (data) => {
      callbacksRef.current.orderStatus.forEach(cb => cb(data))
    })

    socketInstance.on('new-order', (data) => {
      callbacksRef.current.newOrder.forEach(cb => cb(data))
    })

    socketInstance.on('cart-sync', (data) => {
      callbacksRef.current.cartSync.forEach(cb => cb(data))
    })

    socketInstance.on('sales-update', (data) => {
      callbacksRef.current.salesUpdate.forEach(cb => cb(data))
    })

    socketInstance.on('low-stock-alert', (data) => {
      callbacksRef.current.lowStockAlert.forEach(cb => cb(data))
    })

    setSocket(socketInstance)

    // Periodic ping
    const pingInterval = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('ping')
      }
    }, 30000) // Ping every 30 seconds

    // Cleanup
    return () => {
      clearInterval(pingInterval)
      socketInstance.disconnect()
      console.log('[Socket] Disconnected and cleaned up')
    }
  }, [])

  // Room management functions
  const joinProduct = useCallback((productId: string) => {
    if (socket?.connected) {
      socket.emit('join-product', productId)
      console.log('[Socket] Joined product room:', productId)
    }
  }, [socket])

  const leaveProduct = useCallback((productId: string) => {
    if (socket?.connected) {
      socket.emit('leave-product', productId)
      console.log('[Socket] Left product room:', productId)
    }
  }, [socket])

  const joinOrder = useCallback((orderId: string) => {
    if (socket?.connected) {
      socket.emit('join-order', orderId)
      console.log('[Socket] Joined order room:', orderId)
    }
  }, [socket])

  const leaveOrder = useCallback((orderId: string) => {
    if (socket?.connected) {
      socket.emit('leave-order', orderId)
      console.log('[Socket] Left order room:', orderId)
    }
  }, [socket])

  const joinUser = useCallback((userId: string) => {
    if (socket?.connected) {
      socket.emit('join-user', userId)
      console.log('[Socket] Joined user room:', userId)
    }
  }, [socket])

  const leaveUser = useCallback((userId: string) => {
    if (socket?.connected) {
      socket.emit('leave-user', userId)
      console.log('[Socket] Left user room:', userId)
    }
  }, [socket])

  const joinAdmin = useCallback(() => {
    if (socket?.connected) {
      socket.emit('join-admin')
      console.log('[Socket] Joined admin room')
    }
  }, [socket])

  const leaveAdmin = useCallback(() => {
    if (socket?.connected) {
      socket.emit('leave-admin')
      console.log('[Socket] Left admin room')
    }
  }, [socket])

  // Event subscription functions
  const onInventoryUpdate = useCallback((callback: (data: any) => void): (() => void) => {
    callbacksRef.current.inventoryUpdate.push(callback)
    return () => {
      callbacksRef.current.inventoryUpdate = callbacksRef.current.inventoryUpdate.filter(cb => cb !== callback)
    }
  }, [])

  const onOrderStatus = useCallback((callback: (data: any) => void): (() => void) => {
    callbacksRef.current.orderStatus.push(callback)
    return () => {
      callbacksRef.current.orderStatus = callbacksRef.current.orderStatus.filter(cb => cb !== callback)
    }
  }, [])

  const onNewOrder = useCallback((callback: (data: any) => void): (() => void) => {
    callbacksRef.current.newOrder.push(callback)
    return () => {
      callbacksRef.current.newOrder = callbacksRef.current.newOrder.filter(cb => cb !== callback)
    }
  }, [])

  const onCartSync = useCallback((callback: (data: any) => void): (() => void) => {
    callbacksRef.current.cartSync.push(callback)
    return () => {
      callbacksRef.current.cartSync = callbacksRef.current.cartSync.filter(cb => cb !== callback)
    }
  }, [])

  const onSalesUpdate = useCallback((callback: (data: any) => void): (() => void) => {
    callbacksRef.current.salesUpdate.push(callback)
    return () => {
      callbacksRef.current.salesUpdate = callbacksRef.current.salesUpdate.filter(cb => cb !== callback)
    }
  }, [])

  const onLowStockAlert = useCallback((callback: (data: any) => void): (() => void) => {
    callbacksRef.current.lowStockAlert.push(callback)
    return () => {
      callbacksRef.current.lowStockAlert = callbacksRef.current.lowStockAlert.filter(cb => cb !== callback)
    }
  }, [])

  return {
    socket,
    isConnected,
    connectionError,
    joinProduct,
    leaveProduct,
    joinOrder,
    leaveOrder,
    joinUser,
    leaveUser,
    joinAdmin,
    leaveAdmin,
    onInventoryUpdate,
    onOrderStatus,
    onNewOrder,
    onCartSync,
    onSalesUpdate,
    onLowStockAlert
  }
}

/**
 * Hook for product-specific realtime updates
 */
export function useProductRealtime(productId: string | null, onStockChange?: (stock: number) => void) {
  const { socket, isConnected, joinProduct, leaveProduct, onInventoryUpdate } = useSocket()

  useEffect(() => {
    if (isConnected && productId) {
      joinProduct(productId)

      const unsubscribe = onInventoryUpdate((data) => {
        if (data.productId === productId) {
          onStockChange?.(data.stock)
        }
      })

      return () => {
        leaveProduct(productId!)
        unsubscribe()
      }
    }
  }, [isConnected, productId, joinProduct, leaveProduct, onInventoryUpdate, onStockChange])

  return { isConnected, socket }
}

/**
 * Hook for order-specific realtime updates
 */
export function useOrderRealtime(orderId: string | null, onStatusChange?: (status: string) => void) {
  const { socket, isConnected, joinOrder, leaveOrder, onOrderStatus } = useSocket()

  useEffect(() => {
    if (isConnected && orderId) {
      joinOrder(orderId)

      const unsubscribe = onOrderStatus((data) => {
        if (data.orderId === orderId) {
          onStatusChange?.(data.status)
        }
      })

      return () => {
        leaveOrder(orderId!)
        unsubscribe()
      }
    }
  }, [isConnected, orderId, joinOrder, leaveOrder, onOrderStatus, onStatusChange])

  return { isConnected, socket }
}

/**
 * Hook for admin realtime notifications
 */
export function useAdminRealtime() {
  const { socket, isConnected, joinAdmin, leaveAdmin, onNewOrder, onLowStockAlert } = useSocket()

  useEffect(() => {
    if (isConnected) {
      joinAdmin()
      return () => {
        leaveAdmin()
      }
    }
  }, [isConnected, joinAdmin, leaveAdmin])

  return {
    isConnected,
    socket,
    onNewOrder,
    onLowStockAlert
  }
}