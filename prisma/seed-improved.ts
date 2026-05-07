import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting improved database seeding...')

  // Clean existing data (optional - comment out to preserve data)
  console.log('🧹 Cleaning existing data...')
  await prisma.orderItem.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.inventoryAlert.deleteMany()
  await prisma.productReview.deleteMany()
  await prisma.order.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.address.deleteMany()
  await prisma.adminLog.deleteMany()
  await prisma.banner.deleteMany()
  await prisma.story.deleteMany()
  await prisma.reel.deleteMany()
  await prisma.promotion.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()

  // Users
  console.log('👤 Creating users...')
  const users = await Promise.all([
    // Admin users
    prisma.user.create({
      data: {
        email: 'admin@scommerce.com',
        name: 'Admin User',
        password: await hash('admin123', 10),
        role: 'admin',
        emailVerified: 1,
        avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff',
        lastLoginAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
    }),
    prisma.user.create({
      data: {
        email: 'staff@scommerce.com',
        name: 'Staff User',
        password: await hash('staff123', 10),
        role: 'staff',
        emailVerified: 1,
        avatar: 'https://ui-avatars.com/api/?name=Staff+User&background=10b981&color=fff',
        lastLoginAt: new Date(Date.now() - 7200000), // 2 hours ago
      },
    }),

    // Regular customers
    prisma.user.create({
      data: {
        email: 'fatema@example.com',
        name: 'Fatema Akter',
        phone: '+8801700000001',
        password: await hash('user123', 10),
        role: 'user',
        emailVerified: 1,
        avatar: 'https://ui-avatars.com/api/?name=Fatema+Akter&background=ec4899&color=fff',
        lastLoginAt: new Date(Date.now() - 1800000), // 30 minutes ago
      },
    }),
    prisma.user.create({
      data: {
        email: 'rahim@example.com',
        name: 'Rahim Hossain',
        phone: '+8801700000002',
        password: await hash('user123', 10),
        role: 'user',
        emailVerified: 1,
        avatar: 'https://ui-avatars.com/api/?name=Rahim+Hossain&background=3b82f6&color=fff',
        lastLoginAt: new Date(Date.now() - 86400000), // 1 day ago
      },
    }),
    prisma.user.create({
      data: {
        email: 'karim@example.com',
        name: 'Karim Ahmed',
        phone: '+8801700000003',
        password: await hash('user123', 10),
        role: 'user',
        emailVerified: 1,
        avatar: 'https://ui-avatars.com/api/?name=Karim+Ahmed&background=10b981&color=fff',
        lastLoginAt: new Date(Date.now() - 172800000), // 2 days ago
      },
    }),
    prisma.user.create({
      data: {
        email: 'nusrat@example.com',
        name: 'Nusrat Jahan',
        phone: '+8801700000004',
        password: await hash('user123', 10),
        role: 'user',
        emailVerified: 1,
        avatar: 'https://ui-avatars.com/api/?name=Nusrat+Jahan&background=f59e0b&color=fff',
        lastLoginAt: new Date(Date.now() - 259200000), // 3 days ago
      },
    }),
    prisma.user.create({
      data: {
        email: 'banned@example.com',
        name: 'Banned User',
        phone: '+8801700000005',
        password: await hash('user123', 10),
        role: 'user',
        emailVerified: 1,
        isBanned: true,
        bannedAt: new Date(Date.now() - 604800000), // 1 week ago
      },
    }),
  ])

  // Categories
  console.log('📁 Creating categories...')
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Sarees',
        slug: 'sarees',
        description: 'Traditional and modern sarees for every occasion',
        image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
        isActive: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Salwar Kameez',
        slug: 'salwar-kameez',
        description: 'Elegant salwar kameez in various designs',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
        isActive: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Kurtis',
        slug: 'kurtis',
        description: 'Stylish kurtis for casual and formal wear',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
        isActive: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Lehengas',
        slug: 'lehengas',
        description: 'Beautiful lehengas for special occasions',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
        isActive: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Western Wear',
        slug: 'western-wear',
        description: 'Modern western dresses and outfits',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
        isActive: 1,
      },
    }),
  ])

  // Products with Variants
  console.log('🛍️  Creating products with variants...')
  const products = await Promise.all([
    // Product 1: Saree with multiple variants
    prisma.product.create({
      data: {
        name: 'Banarasi Silk Saree',
        slug: 'banarasi-silk-saree',
        description: 'Premium Banarasi silk saree with intricate gold zari work',
        categoryId: categories[0].id,
        price: 5000,
        basePrice: 8000,
        comparePrice: 10000,
        discount: 37.5,
        discountType: 'percentage',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
        ]),
        stock: 50,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: 1,
        isFeatured: 1,
        hasVariants: 1,
        weight: 0.5,
        dimensions: '6m x 1.2m',
        tags: 'saree, silk, banarasi, traditional, wedding',
      },
    }),

    // Product 2: Salwar Kameez Set with variants
    prisma.product.create({
      data: {
        name: 'Embroidered Salwar Kameez Set',
        slug: 'embroidered-salwar-kameez-set',
        description: 'Beautiful embroidered salwar kameez with matching dupatta',
        categoryId: categories[1].id,
        price: 3500,
        basePrice: 3000,
        comparePrice: 4500,
        discount: 0,
        discountType: 'percentage',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
        ]),
        stock: 40,
        lowStockAlert: 8,
        reorderLevel: 4,
        reorderQty: 15,
        isActive: 1,
        isFeatured: 1,
        hasVariants: 1,
        weight: 0.8,
        dimensions: 'Standard',
        tags: 'salwar, kameez, embroidered, festive',
      },
    }),

    // Product 3: Kurti with variants
    prisma.product.create({
      data: {
        name: 'Designer Kurti',
        slug: 'designer-kurti',
        description: 'Trendy designer kurti perfect for casual wear',
        categoryId: categories[2].id,
        price: 1500,
        basePrice: 1200,
        comparePrice: 2000,
        discount: 0,
        discountType: 'percentage',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
        ]),
        stock: 100,
        lowStockAlert: 20,
        reorderLevel: 10,
        reorderQty: 30,
        isActive: 1,
        isFeatured: 1,
        hasVariants: 1,
        weight: 0.3,
        dimensions: 'Standard',
        tags: 'kurti, designer, casual, trendy',
      },
    }),

    // Product 4: Lehenga
    prisma.product.create({
      data: {
        name: 'Bridal Lehenga Choli',
        slug: 'bridal-lehenga-choli',
        description: 'Exquisite bridal lehenga with heavy embroidery work',
        categoryId: categories[3].id,
        price: 15000,
        basePrice: 12000,
        comparePrice: 20000,
        discount: 0,
        discountType: 'percentage',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
        ]),
        stock: 20,
        lowStockAlert: 5,
        reorderLevel: 3,
        reorderQty: 10,
        isActive: 1,
        isFeatured: 0,
        hasVariants: 1,
        weight: 2.5,
        dimensions: 'Custom',
        tags: 'lehenga, bridal, wedding, heavy-work',
      },
    }),

    // Product 5: Western Dress (no variants)
    prisma.product.create({
      data: {
        name: 'Floral Maxi Dress',
        slug: 'floral-maxi-dress',
        description: 'Comfortable floral print maxi dress for summer',
        categoryId: categories[4].id,
        price: 2500,
        basePrice: 2000,
        comparePrice: 3500,
        discount: 0,
        discountType: 'percentage',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
        ]),
        stock: 60,
        lowStockAlert: 12,
        reorderLevel: 6,
        reorderQty: 20,
        isActive: 1,
        isFeatured: 1,
        hasVariants: 0,
        weight: 0.4,
        dimensions: 'Standard',
        tags: 'dress, maxi, floral, summer, western',
      },
    }),
  ])

  // Product Variants
  console.log('📦 Creating product variants...')
  const variants = await Promise.all([
    // Saree variants
    prisma.productVariant.create({
      data: {
        productId: products[0].id,
        sku: 'BS-CR-001',
        name: 'Banarasi Silk Saree - Crimson Red',
        price: 5000,
        comparePrice: 10000,
        stock: 15,
        images: JSON.stringify(['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800']),
        size: 'Standard',
        color: 'Crimson Red',
        material: 'Silk',
        isActive: 1,
        isDefault: 1,
        lowStockAlert: 5,
        reorderLevel: 2,
        reorderQty: 10,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[0].id,
        sku: 'BS-GR-002',
        name: 'Banarasi Silk Saree - Golden',
        price: 5500,
        comparePrice: 11000,
        stock: 20,
        images: JSON.stringify(['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800']),
        size: 'Standard',
        color: 'Golden',
        material: 'Silk',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 5,
        reorderLevel: 2,
        reorderQty: 10,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[0].id,
        sku: 'BS-BL-003',
        name: 'Banarasi Silk Saree - Blue',
        price: 5000,
        comparePrice: 10000,
        stock: 15,
        images: JSON.stringify(['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800']),
        size: 'Standard',
        color: 'Royal Blue',
        material: 'Silk',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 5,
        reorderLevel: 2,
        reorderQty: 10,
      },
    }),

    // Salwar Kameez variants
    prisma.productVariant.create({
      data: {
        productId: products[1].id,
        sku: 'SK-RD-SM-001',
        name: 'Embroidered Salwar Kameez - Red Small',
        price: 3500,
        comparePrice: 4500,
        stock: 10,
        images: JSON.stringify(['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800']),
        size: 'S',
        color: 'Red',
        material: 'Cotton',
        isActive: 1,
        isDefault: 1,
        lowStockAlert: 3,
        reorderLevel: 2,
        reorderQty: 8,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[1].id,
        sku: 'SK-RD-MD-002',
        name: 'Embroidered Salwar Kameez - Red Medium',
        price: 3500,
        comparePrice: 4500,
        stock: 15,
        images: JSON.stringify(['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800']),
        size: 'M',
        color: 'Red',
        material: 'Cotton',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 3,
        reorderLevel: 2,
        reorderQty: 8,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[1].id,
        sku: 'SK-RD-LG-003',
        name: 'Embroidered Salwar Kameez - Red Large',
        price: 3500,
        comparePrice: 4500,
        stock: 15,
        images: JSON.stringify(['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800']),
        size: 'L',
        color: 'Red',
        material: 'Cotton',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 3,
        reorderLevel: 2,
        reorderQty: 8,
      },
    }),

    // Kurti variants
    prisma.productVariant.create({
      data: {
        productId: products[2].id,
        sku: 'DK-BL-SM-001',
        name: 'Designer Kurti - Blue Small',
        price: 1500,
        comparePrice: 2000,
        stock: 30,
        images: JSON.stringify(['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800']),
        size: 'S',
        color: 'Blue',
        material: 'Cotton Blend',
        isActive: 1,
        isDefault: 1,
        lowStockAlert: 8,
        reorderLevel: 4,
        reorderQty: 15,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[2].id,
        sku: 'DK-PK-MD-002',
        name: 'Designer Kurti - Pink Medium',
        price: 1500,
        comparePrice: 2000,
        stock: 35,
        images: JSON.stringify(['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800']),
        size: 'M',
        color: 'Pink',
        material: 'Cotton Blend',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 8,
        reorderLevel: 4,
        reorderQty: 15,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[2].id,
        sku: 'DK-GN-LG-003',
        name: 'Designer Kurti - Green Large',
        price: 1500,
        comparePrice: 2000,
        stock: 35,
        images: JSON.stringify(['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800']),
        size: 'L',
        color: 'Green',
        material: 'Cotton Blend',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 8,
        reorderLevel: 4,
        reorderQty: 15,
      },
    }),

    // Lehenga variants
    prisma.productVariant.create({
      data: {
        productId: products[3].id,
        sku: 'BL-RD-SM-001',
        name: 'Bridal Lehenga - Red Small',
        price: 15000,
        comparePrice: 20000,
        stock: 7,
        images: JSON.stringify(['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800']),
        size: 'S',
        color: 'Red',
        material: 'Silk with Embroidery',
        isActive: 1,
        isDefault: 1,
        lowStockAlert: 2,
        reorderLevel: 1,
        reorderQty: 5,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[3].id,
        sku: 'BL-GN-MD-002',
        name: 'Bridal Lehenga - Green Medium',
        price: 15000,
        comparePrice: 20000,
        stock: 7,
        images: JSON.stringify(['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800']),
        size: 'M',
        color: 'Green',
        material: 'Silk with Embroidery',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 2,
        reorderLevel: 1,
        reorderQty: 5,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[3].id,
        sku: 'BL-MR-LG-003',
        name: 'Bridal Lehenga - Maroon Large',
        price: 15000,
        comparePrice: 20000,
        stock: 6,
        images: JSON.stringify(['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800']),
        size: 'L',
        color: 'Maroon',
        material: 'Silk with Embroidery',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 2,
        reorderLevel: 1,
        reorderQty: 5,
      },
    }),
  ])

  // Orders with diverse statuses
  console.log('📋 Creating orders with diverse statuses...')
  const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
  const paymentStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']
  const trackingStatuses = ['PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED']

  const orderPromises: Promise<any>[] = []
  for (let i = 0; i < 25; i++) {
    const userIndex = i % 5 // Cycle through first 5 users
    const statusIndex = i % orderStatuses.length
    const productIndex = i % products.length
    const variantIndex = i % variants.length

    const orderDate = new Date(Date.now() - i * 86400000) // One day per order
    const status = orderStatuses[statusIndex]

    const orderPromise = prisma.order.create({
      data: {
        orderNumber: `ORD-${String(1000 + i).padStart(6, '0')}`,
        userId: users[2 + userIndex].id,
        customerName: users[2 + userIndex].name || 'Customer',
        customerEmail: users[2 + userIndex].email,
        customerPhone: users[2 + userIndex].phone,
        shippingAddress: JSON.stringify({
          fullName: users[2 + userIndex].name,
          phone: users[2 + userIndex].phone,
          addressLine1: `${100 + i} Main Street`,
          addressLine2: 'Apt 1',
          city: 'Dhaka',
          district: 'Gulshan',
          division: 'Dhaka',
          postalCode: '1212',
        }),
        billingAddress: JSON.stringify({
          fullName: users[2 + userIndex].name,
          phone: users[2 + userIndex].phone,
          addressLine1: `${100 + i} Main Street`,
          addressLine2: 'Apt 1',
          city: 'Dhaka',
          district: 'Gulshan',
          division: 'Dhaka',
          postalCode: '1212',
        }),
        city: 'Dhaka',
        district: 'Gulshan',
        division: 'Dhaka',
        subtotal: products[productIndex].price * (i % 3 + 1),
        shipping: 60,
        tax: products[productIndex].price * 0.15 * (i % 3 + 1),
        discount: i % 5 === 0 ? 100 : 0,
        total: products[productIndex].price * (i % 3 + 1) + 60 + products[productIndex].price * 0.15 * (i % 3 + 1) - (i % 5 === 0 ? 100 : 0),
        status,
        paymentStatus: status === 'CANCELLED' || status === 'REFUNDED' ? paymentStatuses[3] : paymentStatuses[1],
        paymentMethod: i % 2 === 0 ? 'CASH_ON_DELIVERY' : 'CARD',
        trackingNumber: ['SHIPPED', 'DELIVERED'].includes(status) ? `PK-${randomUUID().substring(0, 8).toUpperCase()}` : null,
        trackingStatus: ['SHIPPED', 'DELIVERED'].includes(status) ? trackingStatuses[status === 'SHIPPED' ? 1 : 3] : 'PENDING',
        estimatedDeliveryDate: ['SHIPPED', 'DELIVERED'].includes(status) ? new Date(Date.now() + 5 * 86400000).toISOString() : null,
        cancelledAt: status === 'CANCELLED' ? new Date(Date.now() - (i - 1) * 86400000).toISOString() : null,
        cancelledBy: status === 'CANCELLED' ? users[0].id : null,
        cancellationReason: status === 'CANCELLED' ? 'Customer requested cancellation' : null,
        refundedAt: status === 'REFUNDED' ? new Date(Date.now() - (i - 1) * 86400000).toISOString() : null,
        refundedAmount: status === 'REFUNDED' ? products[productIndex].price * (i % 3 + 1) : null,
        refundMethod: status === 'REFUNDED' ? 'BANK_TRANSFER' : null,
        refundReason: status === 'REFUNDED' ? 'Product damaged' : null,
        notes: i % 7 === 0 ? 'Gift wrapping requested' : null,
        createdAt: orderDate,
      },
    })

    orderPromises.push(orderPromise)
  }

  const orders = await Promise.all(orderPromises)

  // Order Items
  console.log('📦 Creating order items...')
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    const numItems = (i % 3) + 1 // 1-3 items per order

    for (let j = 0; j < numItems; j++) {
      const productIndex = (i + j) % products.length
      const variantIndex = (i + j) % variants.length

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: products[productIndex].id,
          variantId: products[productIndex].hasVariants ? variants[variantIndex].id : null,
          quantity: (i % 2) + 1,
          price: products[productIndex].price,
          productName: products[productIndex].name,
          productImage: JSON.parse(products[productIndex].images || '[]')[0],
          variantSku: products[productIndex].hasVariants ? variants[variantIndex].sku : null,
          variantSize: products[productIndex].hasVariants ? variants[variantIndex].size : null,
          variantColor: products[productIndex].hasVariants ? variants[variantIndex].color : null,
          variantMaterial: products[productIndex].hasVariants ? variants[variantIndex].material : null,
        },
      })
    }
  }

  // Reviews
  console.log('⭐ Creating product reviews...')
  const reviewPromises: Promise<any>[] = []
  const usedProductUserPairs = new Set<string>()

  for (let i = 0; i < 15; i++) {
    const productIndex = i % products.length
    let userIndex = (i * 7) % 5 // Prime multiplier for better distribution

    // Find a unique product-user pair
    let attempts = 0
    let pairKey = `${products[productIndex].id}-${users[2 + userIndex].id}`

    while (usedProductUserPairs.has(pairKey) && attempts < 20) {
      userIndex = (userIndex + 1) % 5
      pairKey = `${products[productIndex].id}-${users[2 + userIndex].id}`
      attempts++
    }

    if (!usedProductUserPairs.has(pairKey)) {
      usedProductUserPairs.add(pairKey)

      reviewPromises.push(
        prisma.productReview.create({
          data: {
            productId: products[productIndex].id,
            userId: users[2 + userIndex].id,
            userName: users[2 + userIndex].name,
            rating: [5, 4, 5, 3, 4, 5, 4, 5, 4, 3][i % 10],
            title: ['Great product!', 'Nice quality', 'Love it!', 'Good value', 'Beautiful design'][i % 5],
            comment: 'This product exceeded my expectations. The quality is excellent and it looks exactly as shown in the pictures.',
            isVerified: 1,
            isApproved: 1,
          },
        })
      )
    }
  }

  await Promise.all(reviewPromises)

  // Banners
  console.log('🎨 Creating banners...')
  await Promise.all([
    prisma.banner.create({
      data: {
        title: 'Summer Sale',
        description: 'Up to 50% off on all items',
        image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1200',
        mobileImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
        buttonText: 'Shop Now',
        buttonLink: '/shop',
        isActive: 1,
        order: 1,
      },
    }),
    prisma.banner.create({
      data: {
        title: 'New Arrivals',
        description: 'Check out our latest collection',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200',
        mobileImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
        buttonText: 'Explore',
        buttonLink: '/shop?sort=newest',
        isActive: 1,
        order: 2,
      },
    }),
  ])

  // Stories
  console.log('📸 Creating stories...')
  await Promise.all([
    prisma.story.create({
      data: {
        title: 'Saree Collection',
        thumbnail: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
        ]),
        isActive: 1,
        order: 1,
      },
    }),
    prisma.story.create({
      data: {
        title: 'Dresses',
        thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
        ]),
        isActive: 1,
        order: 2,
      },
    }),
  ])

  // Reels
  console.log('🎬 Creating reels...')
  await Promise.all([
    prisma.reel.create({
      data: {
        title: 'Saree Draping Tutorial',
        thumbnail: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        productIds: JSON.stringify([products[0].id]),
        isActive: 1,
        order: 1,
      },
    }),
  ])

  // Promotions
  console.log('🏷️  Creating promotions...')
  await Promise.all([
    prisma.promotion.create({
      data: {
        title: 'Ramadan Special',
        description: 'Special discounts for Ramadan',
        image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
        ctaText: 'View Offers',
        ctaLink: '/shop?promotion=ramadan',
        type: 'banner',
        isActive: 1,
        order: 1,
      },
    }),
  ])

  // Inventory Alerts
  console.log('🚨 Creating inventory alerts...')
  await Promise.all([
    prisma.inventoryAlert.create({
      data: {
        variantId: variants[0].id,
        alertType: 'LOW_STOCK',
        quantity: variants[0].stock,
        isRead: 0,
        isResolved: 0,
      },
    }),
    prisma.inventoryAlert.create({
      data: {
        productId: products[4].id,
        alertType: 'LOW_STOCK',
        quantity: products[4].stock,
        isRead: 0,
        isResolved: 0,
      },
    }),
  ])

  // Audit Logs
  console.log('📝 Creating audit logs...')
  const auditActions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT']
  const auditEntities = ['Product', 'Order', 'User', 'Category', 'Settings']

  for (let i = 0; i < 20; i++) {
    await prisma.adminLog.create({
      data: {
        adminId: users[0].id,
        action: auditActions[i % auditActions.length],
        entity: auditEntities[i % auditEntities.length],
        entityId: i < 10 ? products[i % products.length].id : orders[i % orders.length].id,
        details: `${auditActions[i % auditActions.length]} operation on ${auditEntities[i % auditEntities.length]}`,
        ipAddress: `192.168.1.${100 + (i % 50)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - i * 3600000), // One hour per log
      },
    })
  }

  // Cart Items
  console.log('🛒 Creating cart items...')
  await Promise.all([
    prisma.cartItem.create({
      data: {
        userId: users[2].id,
        productId: products[0].id,
        variantId: variants[0].id,
        quantity: 2,
      },
    }),
    prisma.cartItem.create({
      data: {
        userId: users[2].id,
        productId: products[1].id,
        variantId: variants[3].id,
        quantity: 1,
      },
    }),
  ])

  // Wishlist Items
  console.log('❤️  Creating wishlist items...')
  await Promise.all([
    prisma.wishlistItem.create({
      data: {
        userId: users[3].id,
        productId: products[2].id,
      },
    }),
    prisma.wishlistItem.create({
      data: {
        userId: users[3].id,
        productId: products[3].id,
      },
    }),
  ])

  // Homepage Settings
  console.log('⚙️  Creating homepage settings...')
  await Promise.all([
    prisma.homepageSettings.upsert({
      where: { sectionName: 'banners' },
      create: {
        sectionName: 'banners',
        isEnabled: 1,
        autoPlay: 5000,
        displayLimit: 5,
      },
      update: {},
    }),
    prisma.homepageSettings.upsert({
      where: { sectionName: 'stories' },
      create: {
        sectionName: 'stories',
        isEnabled: 1,
        autoPlay: 3000,
        displayLimit: 10,
      },
      update: {},
    }),
    prisma.homepageSettings.upsert({
      where: { sectionName: 'reels' },
      create: {
        sectionName: 'reels',
        isEnabled: 1,
        autoPlay: 4000,
        displayLimit: 8,
      },
      update: {},
    }),
  ])

  console.log('\n✅ Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`  👥 Users: ${users.length}`)
  console.log(`  📁 Categories: ${categories.length}`)
  console.log(`  🛍️  Products: ${products.length}`)
  console.log(`  📦 Product Variants: ${variants.length}`)
  console.log(`  📋 Orders: ${orders.length}`)
  console.log(`  📝 Audit Logs: ${20}`)
  console.log('\n🔐 Demo Credentials:')
  console.log(`  Admin: admin@scommerce.com / admin123`)
  console.log(`  Staff: staff@scommerce.com / staff123`)
  console.log(`  User: fatema@example.com / user123`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
