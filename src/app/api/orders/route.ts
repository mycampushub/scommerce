import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { OrderStatus, PaymentStatus, AlertType } from '@prisma/client'
import { createOrderSchema } from '@/lib/validations'

// Allowed payment methods - Only Cash on Delivery is enabled
const ALLOWED_PAYMENT_METHODS = ['CASH_ON_DELIVERY'] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate using Zod schema
    const validation = createOrderSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Ensure only COD payment method is accepted
    if (validatedData.paymentMethod && !ALLOWED_PAYMENT_METHODS.includes(validatedData.paymentMethod as any)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only Cash on Delivery payment method is currently supported',
          allowedMethods: ALLOWED_PAYMENT_METHODS,
        },
        { status: 400 }
      )
    }

    // Check stock availability for all products
    const outOfStockItems: string[] = []
    for (const item of validatedData.orderItems) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, stock: true, isActive: true },
      })

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            error: `Product ${item.productId} not found`,
          },
          { status: 404 }
        )
      }

      if (!product.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: `Product ${product.name} is not available`,
          },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        outOfStockItems.push(product.name)
      }
    }

    if (outOfStockItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient stock for: ${outOfStockItems.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Generate unique order number and tracking number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
    const trackingNumber = `PK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    // Calculate totals
    const subtotal = validatedData.subtotal
    const shipping = validatedData.shipping
    const tax = validatedData.tax
    const discount = validatedData.discount || 0
    const total = validatedData.total

    // Create order with Cash on Delivery as the only payment method
    const order = await db.order.create({
      data: {
        orderNumber,
        trackingNumber,
        userId: validatedData.userId || null,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone || null,
        shippingAddress: JSON.stringify(validatedData.shippingAddress),
        billingAddress: validatedData.billingAddress
          ? JSON.stringify(validatedData.billingAddress)
          : JSON.stringify(validatedData.shippingAddress),
        subtotal: parseFloat(subtotal.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        status: OrderStatus.PENDING,
        trackingStatus: 'PENDING',
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: 'CASH_ON_DELIVERY', // Only COD is supported
        notes: validatedData.notes || null,
        orderItems: {
          create: validatedData.orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: parseFloat(item.price.toFixed(2)),
            productName: item.productName,
            productImage: item.productImage,
          })),
        },
      },
      include: {
        user: true,
        orderItems: true,
      },
    })

    // Update product stock and generate alerts
    for (const item of validatedData.orderItems) {
      const quantity = item.quantity
      
      // Fetch current product details
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { 
          id: true, 
          name: true, 
          stock: true, 
          lowStockAlert: true, 
          reorderLevel: true,
          reorderQty: true 
        },
      })

      if (!product) continue

      // Update stock
      const newStock = product.stock - quantity
      await db.product.update({
        where: { id: item.productId },
        data: { stock: newStock },
      })

      // Generate inventory alerts based on new stock level
      if (newStock === 0) {
        await db.inventoryAlert.create({
          data: {
            productId: item.productId,
            alertType: AlertType.OUT_OF_STOCK,
            quantity: 0,
          },
        })
      } else if (newStock < product.reorderLevel) {
        // Check if REORDER_NEEDED alert already exists and is not resolved
        const existingAlert = await db.inventoryAlert.findFirst({
          where: {
            productId: item.productId,
            alertType: AlertType.REORDER_NEEDED,
            isResolved: false,
          },
        })

        if (!existingAlert) {
          await db.inventoryAlert.create({
            data: {
              productId: item.productId,
              alertType: AlertType.REORDER_NEEDED,
              quantity: newStock,
            },
          })
        }
      } else if (newStock < product.lowStockAlert) {
        // Check if LOW_STOCK alert already exists and is not resolved
        const existingAlert = await db.inventoryAlert.findFirst({
          where: {
            productId: item.productId,
            alertType: AlertType.LOW_STOCK,
            isResolved: false,
          },
        })

        if (!existingAlert) {
          await db.inventoryAlert.create({
            data: {
              productId: item.productId,
              alertType: AlertType.LOW_STOCK,
              quantity: newStock,
            },
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order created successfully',
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')
    const orderNumber = searchParams.get('orderNumber')

    // Build where clause
    const where: any = {}

    if (userId) {
      where.userId = userId
    } else if (email) {
      where.customerEmail = email
    } else if (orderNumber) {
      where.orderNumber = orderNumber
    }

    // Fetch orders
    const orders = await db.order.findMany({
      where,
      include: {
        orderItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: orders,
      total: orders.length,
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
      },
      { status: 500 }
    )
  }
}
