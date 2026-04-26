import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.adminLog.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  // Create admin user
  console.log('Creating admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      password: hashedPassword,
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  // Create regular users
  console.log('Creating regular users...')
  const user1 = await prisma.user.create({
    data: {
      email: 'user1@example.com',
      name: 'John Doe',
      role: 'user',
      password: await bcrypt.hash('user123', 10),
    },
  })
  const user2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      name: 'Jane Smith',
      role: 'user',
      password: await bcrypt.hash('user123', 10),
    },
  })
  console.log(`Created ${2} regular users`)

  // Create categories
  console.log('Creating categories...')
  const categories = await prisma.category.createMany({
    data: [
      {
        name: 'Sale',
        slug: 'sale',
        description: 'Sale items with up to 70% off',
        image: 'https://cdn.shopify.com/s/files/1/0533/2089/files/01_5.jpg?v=1690000000',
      },
      {
        name: 'Sarees',
        slug: 'saree',
        description: 'Beautiful collection of traditional and modern sarees',
        image: 'https://cdn.shopify.com/s/files/1/0533/2089/files/02_5.jpg?v=1690000000',
      },
      {
        name: 'Salwar Suits',
        slug: 'salwar',
        description: 'Elegant salwar suits for every occasion',
        image: 'https://cdn.shopify.com/s/files/1/0533/2089/files/03_5.jpg?v=1690000000',
      },
      {
        name: 'Lehengas',
        slug: 'lehengas',
        description: 'Stunning lehengas for weddings and special occasions',
        image: 'https://cdn.shopify.com/s/files/1/0533/2089/files/04_5.jpg?v=1690000000',
      },
      {
        name: 'Kurtas',
        slug: 'kurtas',
        description: 'Stylish kurtas for men and women',
        image: 'https://cdn.shopify.com/s/files/1/0533/2089/files/05_5.jpg?v=1690000000',
      },
      {
        name: 'Gowns',
        slug: 'gowns',
        description: 'Elegant gowns for formal events',
        image: 'https://cdn.shopify.com/s/files/1/0533/2089/files/06_5.jpg?v=1690000000',
      },
      {
        name: 'Tops',
        slug: 'tops',
        description: 'Trendy tops and blouses',
        image: 'https://cdn.shopify.com/s/files/1/0533/2089/files/07_5.jpg?v=1690000000',
      },
      {
        name: 'Menswear',
        slug: 'menswear',
        description: 'Traditional and modern menswear',
        image: 'https://cdn.shopify.com/s/files/1/0533/2089/files/08_5.jpg?v=1690000000',
      },
      {
        name: 'Dress Materials',
        slug: 'dress-materials',
        description: 'Premium dress materials for custom stitching',
        image: 'https://cdn.shopify.com/s/files/1/0533/2089/files/03_5.jpg?v=1690000000',
      },
      {
        name: 'Wedding',
        slug: 'wedding',
        description: 'Exquisite wedding collection',
        image: 'https://cdn.shopify.com/s/files/1/0533/2089/files/04_5.jpg?v=1690000000',
      },
    ],
  })
  console.log(`Created ${categories.count} categories`)

  // Get categories for product creation
  const categoryMap = await prisma.category.findMany()

  // Create products
  console.log('Creating products...')
  const products = [
    // Sarees
    {
      name: 'Royal Banarasi Silk Saree',
      slug: 'royal-banarasi-silk-saree',
      description: 'Elegant Banarasi silk saree with intricate gold zari work. Perfect for weddings and special occasions.',
      price: 299.99,
      comparePrice: 449.99,
      categoryId: categoryMap.find(c => c.slug === 'saree')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/saree1.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/saree1-back.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/saree1-detail.jpg?v=1690000000',
      ]),
      stock: 15,
      lowStockAlert: 5,
      isActive: true,
      isFeatured: true,
      attributes: JSON.stringify({ colors: ['Red', 'Maroon', 'Gold'], sizes: ['Standard'], material: 'Silk' }),
    },
    {
      name: 'Pink Chanderi Saree',
      slug: 'pink-chanderi-saree',
      description: 'Lightweight and graceful Chanderi saree in soft pink with delicate embroidery.',
      price: 189.99,
      comparePrice: 249.99,
      categoryId: categoryMap.find(c => c.slug === 'saree')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/saree2.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/saree2-back.jpg?v=1690000000',
      ]),
      stock: 20,
      lowStockAlert: 5,
      isActive: true,
      isFeatured: true,
      attributes: JSON.stringify({ colors: ['Pink', 'Peach', 'Mint'], sizes: ['Standard'], material: 'Chanderi Silk' }),
    },
    {
      name: 'Embroidered Georgette Saree',
      slug: 'embroidered-georgette-saree',
      description: 'Beautiful georgette saree with stunning thread embroidery work.',
      price: 219.99,
      comparePrice: null,
      categoryId: categoryMap.find(c => c.slug === 'saree')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/saree3.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/saree3-back.jpg?v=1690000000',
      ]),
      stock: 12,
      lowStockAlert: 5,
      isActive: true,
      isFeatured: false,
      attributes: JSON.stringify({ colors: ['Blue', 'Navy', 'Black'], sizes: ['Standard'], material: 'Georgette' }),
    },
    {
      name: 'Printed Cotton Saree',
      slug: 'printed-cotton-saree',
      description: 'Comfortable cotton saree with beautiful floral prints. Perfect for daily wear.',
      price: 79.99,
      comparePrice: 99.99,
      categoryId: categoryMap.find(c => c.slug === 'sale')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/saree4.jpg?v=1690000000',
      ]),
      stock: 30,
      lowStockAlert: 10,
      isActive: true,
      isFeatured: false,
      attributes: JSON.stringify({ colors: ['Yellow', 'Green', 'Pink'], sizes: ['Standard'], material: 'Cotton' }),
    },

    // Salwar Suits
    {
      name: 'Anarkali Designer Suit',
      slug: 'anarkali-designer-suit',
      description: 'Stunning Anarkali suit with intricate embroidery and flowing silhouette.',
      price: 169.99,
      comparePrice: 229.99,
      categoryId: categoryMap.find(c => c.slug === 'salwar')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/salwar1.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/salwar1-back.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/salwar1-detail.jpg?v=1690000000',
      ]),
      stock: 18,
      lowStockAlert: 5,
      isActive: true,
      isFeatured: true,
      attributes: JSON.stringify({ colors: ['Maroon', 'Navy', 'Teal'], sizes: ['S', 'M', 'L', 'XL'], material: 'Georgette' }),
    },
    {
      name: 'Straight Cut Palazzo Suit',
      slug: 'straight-cut-palazzo-suit',
      description: 'Contemporary straight cut suit with comfortable palazzo pants.',
      price: 129.99,
      comparePrice: null,
      categoryId: categoryMap.find(c => c.slug === 'salwar')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/salwar2.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/salwar2-back.jpg?v=1690000000',
      ]),
      stock: 25,
      lowStockAlert: 8,
      isActive: true,
      isFeatured: false,
      attributes: JSON.stringify({ colors: ['Beige', 'Grey', 'Black'], sizes: ['S', 'M', 'L', 'XL'], material: 'Rayon' }),
    },
    {
      name: 'Printed Cotton Suit',
      slug: 'printed-cotton-suit',
      description: 'Comfortable cotton suit with beautiful digital prints.',
      price: 89.99,
      comparePrice: 119.99,
      categoryId: categoryMap.find(c => c.slug === 'sale')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/salwar3.jpg?v=1690000000',
      ]),
      stock: 35,
      lowStockAlert: 10,
      isActive: true,
      isFeatured: false,
      attributes: JSON.stringify({ colors: ['Pink', 'Blue', 'Green'], sizes: ['S', 'M', 'L', 'XL'], material: 'Cotton' }),
    },

    // Lehengas
    {
      name: 'Bridal Lehenga Choli',
      slug: 'bridal-lehenga-choli',
      description: 'Exquisite bridal lehenga with heavy embroidery and sequin work.',
      price: 599.99,
      comparePrice: 899.99,
      categoryId: categoryMap.find(c => c.slug === 'wedding')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/lehenga1.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/lehenga1-back.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/lehenga1-detail.jpg?v=1690000000',
      ]),
      stock: 8,
      lowStockAlert: 3,
      isActive: true,
      isFeatured: true,
      attributes: JSON.stringify({ colors: ['Red', 'Maroon'], sizes: ['S', 'M', 'L'], material: 'Velvet' }),
    },
    {
      name: 'Designer Lehenga',
      slug: 'designer-lehenga',
      description: 'Beautiful designer lehenga with mirror work and thread embroidery.',
      price: 349.99,
      comparePrice: null,
      categoryId: categoryMap.find(c => c.slug === 'lehengas')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/lehenga2.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/lehenga2-back.jpg?v=1690000000',
      ]),
      stock: 15,
      lowStockAlert: 5,
      isActive: true,
      isFeatured: true,
      attributes: JSON.stringify({ colors: ['Pink', 'Peach', 'Mint'], sizes: ['S', 'M', 'L'], material: 'Net' }),
    },

    // Kurtas
    {
      name: 'Men\'s Cotton Kurta',
      slug: 'mens-cotton-kurta',
      description: 'Comfortable cotton kurta for men. Perfect for casual and festive occasions.',
      price: 69.99,
      comparePrice: 89.99,
      categoryId: categoryMap.find(c => c.slug === 'kurtas')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/kurta1.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/kurta1-back.jpg?v=1690000000',
      ]),
      stock: 40,
      lowStockAlert: 10,
      isActive: true,
      isFeatured: true,
      attributes: JSON.stringify({ colors: ['White', 'Cream', 'Navy'], sizes: ['S', 'M', 'L', 'XL'], material: 'Cotton' }),
    },
    {
      name: 'Embroidered Kurta Pajama',
      slug: 'embroidered-kurta-pajama',
      description: 'Elegant kurta pajama set with delicate embroidery.',
      price: 129.99,
      comparePrice: 159.99,
      categoryId: categoryMap.find(c => c.slug === 'menswear')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/kurta2.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/kurta2-back.jpg?v=1690000000',
      ]),
      stock: 22,
      lowStockAlert: 8,
      isActive: true,
      isFeatured: true,
      attributes: JSON.stringify({ colors: ['Maroon', 'Navy', 'Black'], sizes: ['S', 'M', 'L', 'XL'], material: 'Silk Blend' }),
    },
    {
      name: 'Sherwani Set',
      slug: 'sherwani-set',
      description: 'Classic sherwani set for weddings and formal events.',
      price: 299.99,
      comparePrice: null,
      categoryId: categoryMap.find(c => c.slug === 'wedding')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/sherwani1.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/sherwani1-back.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/sherwani1-detail.jpg?v=1690000000',
      ]),
      stock: 12,
      lowStockAlert: 5,
      isActive: true,
      isFeatured: true,
      attributes: JSON.stringify({ colors: ['Ivory', 'Gold', 'Black'], sizes: ['S', 'M', 'L', 'XL'], material: 'Velvet' }),
    },

    // Gowns
    {
      name: 'Evening Gown',
      slug: 'evening-gown',
      description: 'Elegant evening gown with beautiful draping.',
      price: 249.99,
      comparePrice: 349.99,
      categoryId: categoryMap.find(c => c.slug === 'gowns')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/gown1.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/gown1-back.jpg?v=1690000000',
      ]),
      stock: 14,
      lowStockAlert: 5,
      isActive: true,
      isFeatured: true,
      attributes: JSON.stringify({ colors: ['Red', 'Black', 'Navy'], sizes: ['S', 'M', 'L'], material: 'Silk Blend' }),
    },
    {
      name: 'Party Gown',
      slug: 'party-gown',
      description: 'Stunning party gown with sequin work.',
      price: 179.99,
      comparePrice: null,
      categoryId: categoryMap.find(c => c.slug === 'gowns')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/gown2.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/gown2-back.jpg?v=1690000000',
      ]),
      stock: 18,
      lowStockAlert: 6,
      isActive: true,
      isFeatured: false,
      attributes: JSON.stringify({ colors: ['Gold', 'Silver', 'Rose Gold'], sizes: ['S', 'M', 'L'], material: 'Georgette' }),
    },

    // Tops
    {
      name: 'Embroidered Top',
      slug: 'embroidered-top',
      description: 'Beautiful embroidered top with modern design.',
      price: 59.99,
      comparePrice: 79.99,
      categoryId: categoryMap.find(c => c.slug === 'sale')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/top1.jpg?v=1690000000',
        'https://cdn.shopify.com/s/files/1/0533/2089/products/top1-back.jpg?v=1690000000',
      ]),
      stock: 45,
      lowStockAlert: 12,
      isActive: true,
      isFeatured: false,
      attributes: JSON.stringify({ colors: ['Pink', 'Blue', 'White'], sizes: ['S', 'M', 'L', 'XL'], material: 'Cotton Blend' }),
    },
    {
      name: 'Printed Tunica',
      slug: 'printed-tunica',
      description: 'Comfortable tunica with trendy prints.',
      price: 49.99,
      comparePrice: null,
      categoryId: categoryMap.find(c => c.slug === 'tops')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/top2.jpg?v=1690000000',
      ]),
      stock: 50,
      lowStockAlert: 15,
      isActive: true,
      isFeatured: false,
      attributes: JSON.stringify({ colors: ['Yellow', 'Orange', 'Green'], sizes: ['S', 'M', 'L', 'XL'], material: 'Rayon' }),
    },

    // Dress Materials
    {
      name: 'Designer Dress Material',
      slug: 'designer-dress-material',
      description: 'Premium dress material set with top, bottom, and dupatta.',
      price: 99.99,
      comparePrice: 129.99,
      categoryId: categoryMap.find(c => c.slug === 'dress-materials')!.id,
      images: JSON.stringify([
        'https://cdn.shopify.com/s/files/1/0533/2089/products/dress-material1.jpg?v=1690000000',
      ]),
      stock: 28,
      lowStockAlert: 8,
      isActive: true,
      isFeatured: false,
      attributes: JSON.stringify({ colors: ['Multi-color', 'Blue', 'Pink'], material: 'Cotton Silk' }),
    },
  ]

  for (const product of products) {
    await prisma.product.create({ data: product })
  }
  console.log(`Created ${products.length} products`)

  // Get all products for order creation
  const productList = await prisma.product.findMany()

  // Create sample orders
  console.log('Creating orders...')

  const createOrder = async (orderData: any) => {
    const items = orderData.orderItems.create
    const order = await prisma.order.create({
      data: {
        orderNumber: orderData.orderNumber,
        userId: orderData.userId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        tax: orderData.tax,
        discount: orderData.discount,
        total: orderData.total,
        status: orderData.status,
        paymentStatus: orderData.paymentStatus,
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes,
      },
    })

    // Create order items
    for (const item of items) {
      const product = productList.find(p => p.id === item.productId)
      if (product) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity: item.quantity,
            price: product.price,
            productName: product.name,
            productImage: product.images,
          },
        })
      }
    }

    return order
  }

  await createOrder({
    orderNumber: 'ORD-001',
    userId: user1.id,
    customerName: 'John Doe',
    customerEmail: 'user1@example.com',
    customerPhone: '+1234567890',
    shippingAddress: '123 Main St, New York, NY 10001',
    billingAddress: '123 Main St, New York, NY 10001',
    subtotal: 469.98,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 469.98,
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.COMPLETED,
    paymentMethod: 'Card',
    notes: 'Please deliver by 5 PM',
    orderItems: {
      create: [
        { productId: productList[0]?.id, quantity: 1, price: 299.99 },
        { productId: productList[4]?.id, quantity: 1, price: 169.99 },
      ],
    },
  })

  await createOrder({
    orderNumber: 'ORD-002',
    userId: user2.id,
    customerName: 'Jane Smith',
    customerEmail: 'user2@example.com',
    customerPhone: '+1987654321',
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90001',
    billingAddress: '456 Oak Ave, Los Angeles, CA 90001',
    subtotal: 599.99,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 599.99,
    status: OrderStatus.PROCESSING,
    paymentStatus: PaymentStatus.COMPLETED,
    paymentMethod: 'Card',
    orderItems: {
      create: [
        { productId: productList[6]?.id, quantity: 1, price: 599.99 },
      ],
    },
  })

  await createOrder({
    orderNumber: 'ORD-003',
    userId: user1.id,
    customerName: 'John Doe',
    customerEmail: 'user1@example.com',
    customerPhone: '+1234567890',
    shippingAddress: '123 Main St, New York, NY 10001',
    billingAddress: '123 Main St, New York, NY 10001',
    subtotal: 139.98,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 139.98,
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    paymentMethod: 'COD',
    orderItems: {
      create: [
        { productId: productList[5]?.id, quantity: 1, price: 89.99 },
        { productId: productList[14]?.id, quantity: 1, price: 49.99 },
      ],
    },
  })

  await createOrder({
    orderNumber: 'ORD-004',
    userId: null,
    customerName: 'Guest Customer',
    customerEmail: 'guest@example.com',
    customerPhone: '+1555555555',
    shippingAddress: '789 Pine Rd, Chicago, IL 60601',
    billingAddress: '789 Pine Rd, Chicago, IL 60601',
    subtotal: 249.99,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 249.99,
    status: OrderStatus.SHIPPED,
    paymentStatus: PaymentStatus.COMPLETED,
    paymentMethod: 'UPI',
    orderItems: {
      create: [
        { productId: productList[11]?.id, quantity: 1, price: 249.99 },
      ],
    },
  })

  await createOrder({
    orderNumber: 'ORD-005',
    userId: user2.id,
    customerName: 'Jane Smith',
    customerEmail: 'user2@example.com',
    customerPhone: '+1987654321',
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90001',
    billingAddress: '456 Oak Ave, Los Angeles, CA 90001',
    subtotal: 209.98,
    shipping: 0,
    tax: 0,
    discount: 20,
    total: 189.98,
    status: OrderStatus.CONFIRMED,
    paymentStatus: PaymentStatus.COMPLETED,
    paymentMethod: 'Card',
    notes: 'Gift wrapping requested',
    orderItems: {
      create: [
        { productId: productList[9]?.id, quantity: 1, price: 129.99 },
        { productId: productList[13]?.id, quantity: 1, price: 79.99 },
      ],
    },
  })

  const orderCount = await prisma.order.count()
  console.log(`Created ${orderCount} orders`)

  // Create sample cart items for users
  console.log('Creating cart items...')
  await prisma.cartItem.createMany({
    data: [
      {
        userId: user1.id,
        productId: productList[1].id,
        quantity: 1,
      },
      {
        userId: user2.id,
        productId: productList[2].id,
        quantity: 2,
      },
    ],
  })
  console.log('Created cart items')

  console.log('Database seeding completed successfully!')
  console.log('\n=== Summary ===')
  console.log(`Users: ${3} (1 admin, 2 regular)`)
  console.log(`Categories: ${categories.count}`)
  console.log(`Products: ${products.length}`)
  console.log(`Orders: ${orderCount}`)
  console.log('\nLogin Credentials:')
  console.log('Admin:')
  console.log('  Email: admin@example.com')
  console.log('  Password: admin123')
  console.log('\nRegular Users:')
  console.log('  Email: user1@example.com')
  console.log('  Password: user123')
  console.log('  Email: user2@example.com')
  console.log('  Password: user123')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
