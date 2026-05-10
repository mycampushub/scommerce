import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  console.log('🗑️  Clearing existing data...')
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.productReview.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.address.deleteMany()
  await prisma.adminLog.deleteMany()
  await prisma.inventoryAlert.deleteMany()
  await prisma.post.deleteMany()
  await prisma.banner.deleteMany()
  await prisma.story.deleteMany()
  await prisma.reel.deleteMany()
  await prisma.promotion.deleteMany()
  await prisma.siteSettings.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Cleared existing data')

  // Create Categories
  console.log('📦 Creating categories...')
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        id: 'cat-lehengas',
        name: 'Lehengas',
        slug: 'lehengas',
        description: 'Traditional and contemporary lehengas for every occasion',
        image: '/images/categories/lehengas.svg',
        isActive: 1,
      },
    }),
    prisma.category.create({
      data: {
        id: 'cat-sarees',
        name: 'Sarees',
        slug: 'sarees',
        description: 'Beautiful collection of sarees from across India',
        image: '/images/categories/sarees.svg',
        isActive: 1,
      },
    }),
    prisma.category.create({
      data: {
        id: 'cat-salwar',
        name: 'Salwar Suits',
        slug: 'salwar',
        description: 'Comfortable and elegant salwar suits',
        image: '/images/categories/salwar.svg',
        isActive: 1,
      },
    }),
    prisma.category.create({
      data: {
        id: 'cat-kurtas',
        name: 'Kurtas',
        slug: 'kurtas',
        description: 'Stylish kurtas for modern women',
        image: '/images/categories/kurtas.svg',
        isActive: 1,
      },
    }),
    prisma.category.create({
      data: {
        id: 'cat-tops',
        name: 'Tops',
        slug: 'tops',
        description: 'Trendy tops for casual and formal wear',
        image: '/images/categories/tops.svg',
        isActive: 1,
      },
    }),
    prisma.category.create({
      data: {
        id: 'cat-gowns',
        name: 'Gowns',
        slug: 'gowns',
        description: 'Elegant gowns for special occasions',
        image: '/images/categories/gowns.svg',
        isActive: 1,
      },
    }),
    prisma.category.create({
      data: {
        id: 'cat-menswear',
        name: 'Menswear',
        slug: 'menswear',
        description: 'Traditional and modern menswear collection',
        image: '/images/categories/menswear.svg',
        isActive: 1,
      },
    }),
  ])
  console.log(`✅ Created ${categories.length} categories`)

  // Create Admin User
  console.log('👤 Creating admin user...')
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      id: 'user-admin-001',
      email: 'admin@scommerce.com',
      name: 'Admin User',
      phone: '+8801700000001',
      password: adminPassword,
      emailVerified: 1,
      role: 'admin',
    },
  })
  console.log('✅ Created admin user')

  // Create Staff Users
  console.log('👥 Creating staff users...')
  const staffPassword = await bcrypt.hash('staff123', 10)
  const staff = await Promise.all([
    prisma.user.create({
      data: {
        id: 'user-staff-001',
        email: 'rahul@scommerce.com',
        name: 'Rahul Sharma',
        phone: '+8801700000002',
        password: staffPassword,
        emailVerified: 1,
        role: 'staff',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-staff-002',
        email: 'priya@scommerce.com',
        name: 'Priya Singh',
        phone: '+8801700000003',
        password: staffPassword,
        emailVerified: 1,
        role: 'staff',
      },
    }),
  ])
  console.log(`✅ Created ${staff.length} staff users`)

  // Create Customer Users
  console.log('👥 Creating customer users...')
  const customerPassword = await bcrypt.hash('customer123', 10)
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        id: 'user-cust-001',
        email: 'fatema@example.com',
        name: 'Fatema Akhter',
        phone: '+8801700000101',
        password: customerPassword,
        emailVerified: 1,
        role: 'user',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-cust-002',
        email: 'noor@example.com',
        name: 'Noor Jahan',
        phone: '+8801700000102',
        password: customerPassword,
        emailVerified: 1,
        role: 'user',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-cust-003',
        email: 'sara@example.com',
        name: 'Sara Ahmed',
        phone: '+8801700000103',
        password: customerPassword,
        emailVerified: 1,
        role: 'user',
      },
    }),
  ])
  console.log(`✅ Created ${customers.length} customer users`)

  // Create Products with Variants
  console.log('🛍️  Creating products with variants...')
  
  // Lehenga with variants
  const lehengaProduct = await prisma.product.create({
    data: {
      id: 'prod-lh-001',
      name: 'Red Bridal Lehenga',
      slug: 'red-bridal-lehenga',
      description: 'Stunning red bridal lehenga with intricate embroidery work',
      categoryId: 'cat-lehengas',
      price: 15000,
      basePrice: 15000,
      comparePrice: 18000,
      discount: 16.67,
      discountType: 'percentage',
      images: JSON.stringify(['/images/products/lehenga-1.svg']),
      stock: 10,
      isActive: 1,
      isFeatured: 1,
      hasVariants: 1,
      lowStockAlert: 5,
      reorderLevel: 2,
      reorderQty: 10,
    },
  })

  // Create variants for Red Bridal Lehenga
  await prisma.productVariant.createMany({
    data: [
      {
        id: 'pv-lh-001-1',
        productId: 'prod-lh-001',
        sku: 'LH-RED-S',
        name: 'Red Bridal Lehenga - Size S',
        price: 15000,
        comparePrice: 18000,
        stock: 3,
        images: JSON.stringify(['/images/products/lehenga-1.svg']),
        size: 'S',
        color: 'Red',
        material: 'Velvet',
        isActive: 1,
        isDefault: 1,
        lowStockAlert: 5,
        reorderLevel: 2,
        reorderQty: 5,
      },
      {
        id: 'pv-lh-001-2',
        productId: 'prod-lh-001',
        sku: 'LH-RED-M',
        name: 'Red Bridal Lehenga - Size M',
        price: 15000,
        comparePrice: 18000,
        stock: 4,
        images: JSON.stringify(['/images/products/lehenga-1.svg']),
        size: 'M',
        color: 'Red',
        material: 'Velvet',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 5,
        reorderLevel: 2,
        reorderQty: 5,
      },
      {
        id: 'pv-lh-001-3',
        productId: 'prod-lh-001',
        sku: 'LH-RED-L',
        name: 'Red Bridal Lehenga - Size L',
        price: 15000,
        comparePrice: 18000,
        stock: 3,
        images: JSON.stringify(['/images/products/lehenga-1.svg']),
        size: 'L',
        color: 'Red',
        material: 'Velvet',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 5,
        reorderLevel: 2,
        reorderQty: 5,
      },
    ],
  })

  // Saree with color variants
  const sareeProduct = await prisma.product.create({
    data: {
      id: 'prod-sa-001',
      name: 'Silk Banarasi Saree',
      slug: 'silk-banarasi-saree',
      description: 'Pure silk Banarasi saree with gold border',
      categoryId: 'cat-sarees',
      price: 8000,
      basePrice: 8000,
      comparePrice: 10000,
      discount: 20,
      discountType: 'percentage',
      images: JSON.stringify(['/images/products/saree-1.jpg']),
      stock: 5,
      isActive: 1,
      isFeatured: 1,
      hasVariants: 1,
      lowStockAlert: 10,
      reorderLevel: 5,
      reorderQty: 10,
    },
  })

  // Create variants for Silk Banarasi Saree
  await prisma.productVariant.createMany({
    data: [
      {
        id: 'pv-sa-001-1',
        productId: 'prod-sa-001',
        sku: 'SA-SILK-RED',
        name: 'Silk Banarasi Saree - Red',
        price: 8000,
        comparePrice: 10000,
        stock: 5,
        images: JSON.stringify(['/images/products/saree-1.jpg']),
        size: 'One Size',
        color: 'Red',
        material: 'Silk',
        isActive: 1,
        isDefault: 1,
        lowStockAlert: 5,
        reorderLevel: 2,
        reorderQty: 5,
      },
      {
        id: 'pv-sa-001-2',
        productId: 'prod-sa-001',
        sku: 'SA-SILK-GRN',
        name: 'Silk Banarasi Saree - Green',
        price: 8000,
        comparePrice: 10000,
        stock: 4,
        images: JSON.stringify(['/images/products/saree-1.jpg']),
        size: 'One Size',
        color: 'Green',
        material: 'Silk',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 5,
        reorderLevel: 2,
        reorderQty: 5,
      },
      {
        id: 'pv-sa-001-3',
        productId: 'prod-sa-001',
        sku: 'SA-SILK-BLU',
        name: 'Silk Banarasi Saree - Blue',
        price: 8000,
        comparePrice: 10000,
        stock: 3,
        images: JSON.stringify(['/images/products/saree-1.jpg']),
        size: 'One Size',
        color: 'Blue',
        material: 'Silk',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 5,
        reorderLevel: 2,
        reorderQty: 5,
      },
    ],
  })

  // Anarkali Suit with size variants
  const anarkaliProduct = await prisma.product.create({
    data: {
      id: 'prod-sw-001',
      name: 'Anarkali Suit',
      slug: 'anarkali-suit',
      description: 'Beautiful Anarkali salwar suit',
      categoryId: 'cat-salwar',
      price: 4000,
      basePrice: 4000,
      comparePrice: 5000,
      discount: 20,
      discountType: 'percentage',
      images: JSON.stringify(['/images/products/salwar-1.jpg']),
      stock: 15,
      isActive: 1,
      isFeatured: 1,
      hasVariants: 1,
      lowStockAlert: 10,
      reorderLevel: 5,
      reorderQty: 10,
    },
  })

  // Create variants for Anarkali Suit
  await prisma.productVariant.createMany({
    data: [
      {
        id: 'pv-sw-001-1',
        productId: 'prod-sw-001',
        sku: 'SW-ANA-S',
        name: 'Anarkali Suit - Size S',
        price: 4000,
        comparePrice: 5000,
        stock: 8,
        images: JSON.stringify(['/images/products/salwar-1.jpg']),
        size: 'S',
        material: 'Cotton',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 5,
        reorderLevel: 3,
        reorderQty: 8,
      },
      {
        id: 'pv-sw-001-2',
        productId: 'prod-sw-001',
        sku: 'SW-ANA-M',
        name: 'Anarkali Suit - Size M',
        price: 4000,
        comparePrice: 5000,
        stock: 7,
        images: JSON.stringify(['/images/products/salwar-1.jpg']),
        size: 'M',
        material: 'Cotton',
        isActive: 1,
        isDefault: 1,
        lowStockAlert: 5,
        reorderLevel: 3,
        reorderQty: 8,
      },
      {
        id: 'pv-sw-001-3',
        productId: 'prod-sw-001',
        sku: 'SW-ANA-L',
        name: 'Anarkali Suit - Size L',
        price: 4000,
        comparePrice: 5000,
        stock: 6,
        images: JSON.stringify(['/images/products/salwar-1.jpg']),
        size: 'L',
        material: 'Cotton',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 5,
        reorderLevel: 3,
        reorderQty: 8,
      },
      {
        id: 'pv-sw-001-4',
        productId: 'prod-sw-001',
        sku: 'SW-ANA-XL',
        name: 'Anarkali Suit - Size XL',
        price: 4000,
        comparePrice: 5000,
        stock: 5,
        images: JSON.stringify(['/images/products/salwar-1.jpg']),
        size: 'XL',
        material: 'Cotton',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 5,
        reorderLevel: 3,
        reorderQty: 8,
      },
    ],
  })

  // Embroidered Kurta with size and color variants
  const kurtaProduct = await prisma.product.create({
    data: {
      id: 'prod-ku-001',
      name: 'Embroidered Kurta',
      slug: 'embroidered-kurta',
      description: 'Beautiful embroidered kurta',
      categoryId: 'cat-kurtas',
      price: 2000,
      basePrice: 2000,
      comparePrice: 2500,
      discount: 20,
      discountType: 'percentage',
      images: JSON.stringify(['/images/products/kurta-1.jpg']),
      stock: 25,
      isActive: 1,
      isFeatured: 1,
      hasVariants: 1,
      lowStockAlert: 10,
      reorderLevel: 5,
      reorderQty: 20,
    },
  })

  // Create variants for Embroidered Kurta
  await prisma.productVariant.createMany({
    data: [
      {
        id: 'pv-ku-001-1',
        productId: 'prod-ku-001',
        sku: 'KU-EMB-BLK-S',
        name: 'Embroidered Kurta - Black S',
        price: 2000,
        comparePrice: 2500,
        stock: 10,
        images: JSON.stringify(['/images/products/kurta-1.jpg']),
        size: 'S',
        color: 'Black',
        material: 'Cotton',
        isActive: 1,
        isDefault: 1,
        lowStockAlert: 5,
        reorderLevel: 3,
        reorderQty: 8,
      },
      {
        id: 'pv-ku-001-2',
        productId: 'prod-ku-001',
        sku: 'KU-EMB-BLK-M',
        name: 'Embroidered Kurta - Black M',
        price: 2000,
        comparePrice: 2500,
        stock: 10,
        images: JSON.stringify(['/images/products/kurta-1.jpg']),
        size: 'M',
        color: 'Black',
        material: 'Cotton',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 5,
        reorderLevel: 3,
        reorderQty: 8,
      },
      {
        id: 'pv-ku-001-3',
        productId: 'prod-ku-001',
        sku: 'KU-EMB-WHT-S',
        name: 'Embroidered Kurta - White S',
        price: 2000,
        comparePrice: 2500,
        stock: 8,
        images: JSON.stringify(['/images/products/kurta-1.jpg']),
        size: 'S',
        color: 'White',
        material: 'Cotton',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 5,
        reorderLevel: 3,
        reorderQty: 8,
      },
      {
        id: 'pv-ku-001-4',
        productId: 'prod-ku-001',
        sku: 'KU-EMB-WHT-M',
        name: 'Embroidered Kurta - White M',
        price: 2000,
        comparePrice: 2500,
        stock: 9,
        images: JSON.stringify(['/images/products/kurta-1.jpg']),
        size: 'M',
        color: 'White',
        material: 'Cotton',
        isActive: 1,
        isDefault: 0,
        lowStockAlert: 5,
        reorderLevel: 3,
        reorderQty: 8,
      },
    ],
  })

  console.log('✅ Created products with variants')

  // Create Sample Orders
  console.log('📦 Creating sample orders...')
  const order1 = await prisma.order.create({
    data: {
      id: 'order-001',
      orderNumber: 'ORD-001',
      userId: 'user-cust-001',
      customerName: 'Fatema Akhter',
      customerEmail: 'fatema@example.com',
      customerPhone: '+8801700000101',
      shippingAddress: JSON.stringify({
        fullName: 'Fatema Akhter',
        phone: '+8801700000101',
        addressLine1: '123 Mirpur Road',
        addressLine2: 'Apartment 4B',
        city: 'Dhaka',
        district: 'Mirpur',
        division: 'Dhaka',
        postalCode: '1216',
      }),
      billingAddress: JSON.stringify({
        fullName: 'Fatema Akhter',
        phone: '+8801700000101',
        addressLine1: '123 Mirpur Road',
        addressLine2: 'Apartment 4B',
        city: 'Dhaka',
        district: 'Mirpur',
        division: 'Dhaka',
        postalCode: '1216',
      }),
      city: 'Dhaka',
      district: 'Mirpur',
      division: 'Dhaka',
      subtotal: 15000,
      shipping: 150,
      tax: 2700,
      discount: 3000,
      total: 18350,
      status: 'DELIVERED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'cod',
    },
  })

  // Create order items for order1
  await prisma.orderItem.create({
    data: {
      id: 'oi-001-1',
      orderId: 'order-001',
      productId: 'prod-lh-001',
      variantId: 'pv-lh-001-1',
      quantity: 1,
      price: 15000,
      productName: 'Red Bridal Lehenga',
      productImage: '/images/products/lehenga-1.jpg',
      variantSku: 'LH-RED-S',
      variantSize: 'S',
      variantColor: 'Red',
      variantMaterial: 'Velvet',
    },
  })

  console.log('✅ Created sample orders')

  // Create Site Settings
  console.log('⚙️  Creating site settings...')
  await prisma.siteSettings.create({
    data: {
      id: 'settings-001',
      siteName: 'SCommerce',
      currency: 'BDT',
      currencySymbol: '৳',
      taxRate: 0.18,
      freeShippingThreshold: 5000,
      baseShippingCost: 150,
    },
  })
  console.log('✅ Created site settings')

  console.log('🎉 Database seed completed successfully!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   - Categories: ${categories.length}`)
  console.log(`   - Users: ${1 + staff.length + customers.length} (1 admin, ${staff.length} staff, ${customers.length} customers)`)
  console.log('   - Products with variants: 4')
  console.log('   - Orders: 1')
  console.log('')
  console.log('🔐 Login credentials:')
  console.log('   Admin: admin@scommerce.com / admin123')
  console.log('   Staff: rahul@scommerce.com / staff123')
  console.log('   Staff: priya@scommerce.com / staff123')
  console.log('   Customer: fatema@example.com / customer123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
