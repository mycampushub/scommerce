import { Server as SocketIOServer } from 'socket.io'

export function setupBroadcastEndpoint(io: SocketIOServer, expressApp: any) {
  expressApp.post('/broadcast', (req: any, res: any) => {
    const { type, data } = req.body

    switch (type) {
      case 'inventory-update':
        io.to(`product-${data.productId}`).emit('inventory-update', {
          ...data,
          timestamp: new Date().toISOString()
        })
        break

      case 'order-status':
        io.to(`order-${data.orderId}`).emit('order-status', {
          ...data,
          timestamp: new Date().toISOString()
        })
        break

      case 'new-order':
        io.to('admin').emit('new-order', {
          ...data,
          timestamp: new Date().toISOString()
        })
        break

      case 'low-stock':
        io.to('admin').emit('low-stock-alert', {
          ...data,
          timestamp: new Date().toISOString()
        })
        break

      default:
        console.warn('Unknown broadcast type:', type)
    }

    res.json({ success: true })
  })
}
