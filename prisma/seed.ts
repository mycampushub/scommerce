import { PrismaClient } from '@prisma/client'
import { hash } from 'crypto'

const prisma = new PrismaClient()

// Helper function to get or create category
async function getOrCreateCategory(name: string, slug: string) {
  let category = await prisma.category.findUnique({
    where: { slug }
  })

  if (!category) {
    category = await prisma.category.create({
      data: {
        name,
        slug,
        description: `${name} collection for SCommerce`,
        isActive: 1,
        image: `/images/categories/${slug}.svg`,
      }
    })
  }

  return category
}

// Helper function to generate unique ID
function generateId(prefix: string = ''): string {
  return `${prefix}_${hash(Date.now().toString())}`
}

// Main seed function
async function main() {
  console.log('Starting database seed...')

  try {
    // ============================================
    // CATEGORIES
    // ============================================
    console.log('Seeding categories...')

    const categories = [
      { name: 'Lehengas', slug: 'lehengas', description: 'Traditional and contemporary lehengas for every occasion', image: '/images/categories/lehengas.svg' },
      { name: 'Sarees', slug: 'sarees', description: 'Beautiful collection of sarees from across India', image: '/images/categories/sarees.svg' },
      { name: 'Salwar Suits', slug: 'salwar', description: 'Comfortable and elegant salwar suits', image: '/images/categories/salwar.svg' },
      { name: 'Kurtas', slug: 'kurtas', description: 'Stylish kurtas for modern women', image: '/images/categories/kurtas.svg' },
      { name: 'Gowns', slug: 'gowns', description: 'Elegant gowns for special occasions', image: '/images/categories/gowns.svg' },
      { name: 'Menswear', slug: 'menswear', description: 'Traditional and modern menswear collection', image: '/images/categories/menswear.svg' },
      { name: 'Tops', slug: 'tops', description: 'Trendy tops for casual and formal wear', image: '/images/categories/tops.svg' },
    ]

    for (const cat of categories) {
      await getOrCreateCategory(cat.name, cat.slug)
    }

    console.log(`Created ${categories.length} categories`)

    // ============================================
    // PRODUCTS
    // ============================================
    console.log('Seeding products...')

    const productTemplates = [
      // Lehengas
      {
        name: 'Red Bridal Lehenga',
        slug: 'red-bridal-lehenga',
        description: 'Stunning red bridal lehenga with intricate embroidery work',
        categoryId: 'lehengas',
        basePrice: 15000,
        comparePrice: null,
        price: 15000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/lehenga-1.svg'],
        stock: 50,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: true,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'bridal, embroidery, wedding, festive',
      },
      {
        name: 'Pink Designer Lehenga',
        slug: 'pink-designer-lehenga',
        description: 'Beautiful pink lehenga with stone work',
        categoryId: 'lehengas',
        basePrice: 12000,
        comparePrice: null,
        price: 12000,
        discount: 10,
        discountType: 'percentage',
        images: ['/images/products/lehenga-2.svg'],
        stock: 30,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: true,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'bridal, pink, stone, designer',
      },
      {
        name: 'Green Festive Lehenga',
        slug: 'green-festive-lehenga',
        description: 'Elegant green lehenga perfect for festivals',
        categoryId: 'lehengas',
        basePrice: 8000,
        comparePrice: null,
        price: 8000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/lehenga-3.svg'],
        stock: 20,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: true,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'bridal, green, festival, festive',
      },
      {
        name: 'Royal Blue Lehenga',
        slug: 'royal-blue-lehenga',
        description: 'Royal blue lehenga with zari work',
        categoryId: 'lehengas',
        basePrice: 10000,
        comparePrice: null,
        price: 10000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/lehenga-4.svg'],
        stock: 15,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'bridal, blue, zari, royal',
      },
      {
        name: 'Maroon Party Lehenga',
        slug: 'maroon-party-lehenga',
        description: 'Gorgeous maroon lehenga for parties',
        categoryId: 'lehengas',
        basePrice: 9500,
        comparePrice: null,
        price: 9500,
        discount: 20,
        discountType: 'percentage',
        images: ['/images/products/lehenga-5.svg'],
        stock: 10,
        lowStockAlert: 5,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: true,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'bridal, maroon, party, wedding',
      },

      // Sarees
      {
        name: 'Silk Banarasi Saree',
        slug: 'silk-banarasi-saree',
        description: 'Pure silk Banarasi saree with gold border',
        categoryId: 'sarees',
        basePrice: 8000,
        comparePrice: null,
        price: 8000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/saree-1.svg'],
        stock: 50,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: true,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'silk, gold, border',
      },
      {
        name: 'Chanderi Saree',
        slug: 'chanderi-saree',
        description: 'Lightweight Chanderi saree',
        categoryId: 'sarees',
        basePrice: 5000,
        comparePrice: null,
        price: 5000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/saree-2.svg'],
        stock: 35,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'silk, lightweight, chanderi',
      },
      {
        name: 'Georgette Saree',
        slug: 'georgette-saree',
        description: 'Elegant georgette saree with sequin work',
        categoryId: 'sarees',
        basePrice: 3500,
        comparePrice: null,
        price: 3500,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/saree-3.svg'],
        stock: 25,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'silk, georgette, sequin',
      },
      {
        name: 'Cotton Printed Saree',
        slug: 'cotton-printed-saree',
        description: 'Comfortable cotton saree with traditional prints',
        categoryId: 'sarees',
        basePrice: 2000,
        comparePrice: null,
        price: 2000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/saree-4.svg'],
        stock: 30,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'cotton, printed, comfortable',
      },

      // Salwar Suits
      {
        name: 'Anarkali Suit',
        slug: 'anarkali-suit',
        description: 'Beautiful Anarkali salwar suit',
        categoryId: 'salwar',
        basePrice: 4000,
        comparePrice: null,
        price: 4000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/salwar-1.svg'],
        stock: 25,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: true,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'anarkali, salwar, party, wedding',
      },
      {
        name: 'Palazzo Suit',
        slug: 'palazzo-suit',
        description: 'Modern palazzo salwar suit',
        categoryId: 'salwar',
        basePrice: 3500,
        comparePrice: null,
        price: 3500,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/salwar-2.svg'],
        stock: 20,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'palazzo, modern, party',
      },
      {
        name: 'Straight Cut Suit',
        slug: 'straight-cut-suit',
        description: 'Elegant straight cut salwar suit',
        categoryId: 'salwar',
        basePrice: 3000,
        comparePrice: null,
        price: 3000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/salwar-3.jpg'],
        stock: 18,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'straight, modern, formal',
      },
      {
        name: 'Churidar Suit',
        slug: 'churidar-suit',
        description: 'Classic churidar salwar suit',
        categoryId: 'salwar',
        basePrice: 3800,
        comparePrice: null,
        price: 3800,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/salwar-4.jpg'],
        stock: 22,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'churidar, classic, modern, formal',
      },
      {
        name: 'Patiala Suit',
        slug: 'patiala-suit',
        description: 'Traditional Patiala salwar suit',
        categoryId: 'salwar',
        basePrice: 3800,
        comparePrice: null,
        price: 3800,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/salwar-5.jpg'],
        stock: 18,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'patiala, traditional, party',
      },

      // Kurtas
      {
        name: 'Embroidered Kurta',
        slug: 'embroidered-kurta',
        description: 'Beautiful embroidered kurta',
        categoryId: 'kurtas',
        basePrice: 2000,
        comparePrice: null,
        price: 2000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/kurta-1.jpg'],
        stock: 25,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: true,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'embroided, kurta, festive',
      },
      {
        name: 'Printed Kurta',
        slug: 'printed-kurta',
        description: 'Trendy printed kurta',
        categoryId: 'kurtas',
        basePrice: 1500,
        comparePrice: null,
        price: 1500,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/kurta-2.jpg'],
        stock: 20,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: true,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'kurta, printed, trendy',
      },
      {
        name: 'Solid Kurta',
        slug: 'solid-kurta',
        description: 'Elegant solid color kurta',
        categoryId: 'kurtas',
        basePrice: 1800,
        comparePrice: null,
        price: 1800,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/kurta-3.jpg'],
        stock: 22,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'solid, color, modern',
      },
      {
        name: 'A-Line Kurta',
        slug: 'a-line-kurta',
        description: 'Flattering A-line kurta',
        categoryId: 'kurtas',
        basePrice: 2200,
        comparePrice: null,
        price: 2200,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/kurta-4.jpg'],
        stock: 18,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'a-line, flatter, modern',
      },
      {
        name: 'Long Straight Kurta',
        slug: 'long-straight-kurta',
        description: 'Modern long straight kurta',
        categoryId: 'kurtas',
        basePrice: 2000,
        comparePrice: null,
        price: 2000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/kurta-5.jpg'],
        stock: 18,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'long, straight, modern',
      },

      // Tops
      {
        name: 'Floral Top',
        slug: 'floral-top',
        description: 'Beautiful floral print top',
        categoryId: 'tops',
        basePrice: 1200,
        comparePrice: null,
        price: 1200,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/top-1.jpg'],
        stock: 40,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'floral, top, casual',
      },
      {
        name: 'Striped Top',
        slug: 'striped-top',
        description: 'Classic striped top',
        categoryId: 'tops',
        basePrice: 1000,
        comparePrice: null,
        price: 1000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/top-2.jpg'],
        stock: 35,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'striped, classic, casual',
      },
      {
        name: 'Solid Color Top',
        slug: 'solid-color-top',
        description: 'Versatile solid color top',
        categoryId: 'tops',
        basePrice: 900,
        comparePrice: null,
        price: 900,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/top-3.jpg'],
        stock: 30,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'solid, color, versatile',
      },
      {
        name: 'Peplum Top',
        slug: 'peplum-top',
        description: 'Stylish peplum top',
        categoryId: 'tops',
        basePrice: 1500,
        comparePrice: null,
        price: 1500,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/top-4.jpg'],
        stock: 20,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'peplum, stylish, fashion',
      },
      {
        name: 'Off-Shoulder Top',
        slug: 'off-shoulder-top',
        description: 'Trendy off-shoulder top',
        categoryId: 'tops',
        basePrice: 1800,
        comparePrice: null,
        price: 1800,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/top-5.jpg'],
        stock: 15,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'off-shoulder, trendy',
      },

      // Gowns
      {
        name: 'Evening Gown',
        slug: 'evening-gown',
        description: 'Elegant evening gown',
        categoryId: 'gowns',
        basePrice: 25000,
        comparePrice: null,
        price: 25000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/gown-1.jpg'],
        stock: 8,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: true,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'evening, gown, wedding, party',
      },
      {
        name: 'Wedding Gown',
        slug: 'wedding-gown',
        description: 'Beautiful wedding gown',
        categoryId: 'gowns',
        basePrice: 50000,
        comparePrice: null,
        price: 50000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/gown-2.jpg'],
        stock: 5,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: true,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'wedding, party, special',
      },
      {
        name: 'Party Gown',
        slug: 'party-gown',
        description: 'Stylish party gown',
        categoryId: 'gowns',
        basePrice: 80000,
        comparePrice: null,
        price: 80000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/gown-3.jpg'],
        stock: 3,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: true,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'party, gown, stylish',
      },
      {
        name: 'Cocktail Gown',
        slug: 'cocktail-gown',
        description: 'Chic cocktail gown',
        categoryId: 'gowns',
        basePrice: 12000,
        comparePrice: null,
        price: 12000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/gown-4.jpg'],
        stock: 10,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'cocktail, gown, formal',
      },
      {
        name: 'Maxi Gown',
        slug: 'maxi-gown',
        description: 'Flowing maxi gown',
        categoryId: 'gowns',
        basePrice: 90000,
        comparePrice: null,
        price: 90000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/gown-5.jpg'],
        stock: 5,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: false,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'maxi, gown, flow',
      },

      // Menswear
      {
        name: 'Men Kurta Pyjama',
        slug: 'men-kurta-pyjama',
        description: 'Traditional kurta pyjama set',
        categoryId: 'menswear',
        basePrice: 3000,
        comparePrice: null,
        price: 3000,
        discount: null,
        discountType: 'percentage',
        images: ['/images/products/men-1.jpg'],
        stock: 40,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
        isActive: true,
        isFeatured: true,
        hasVariants: false,
        weight: null,
        dimensions: null,
        tags: 'kurta, traditional, formal',
      },
    ]

    // Create products
    let createdCount = 0
    for (const product of productTemplates) {
      try {
        // Get or create category
        const category = await getOrCreateCategory(product.categoryId, product.slug)

        // Create product
        const createdProduct = await prisma.product.create({
          data: {
            id: generateId('prod'),
            name: product.name,
            slug: product.slug,
            description: product.description,
            categoryId: category.id,
            basePrice: product.basePrice,
            price: product.price,
            comparePrice: product.comparePrice,
            discount: product.discount,
            discountType: product.discountType,
            images: JSON.stringify(product.images),
            stock: product.stock,
            lowStockAlert: product.lowStockAlert,
            reorderLevel: product.reorderLevel,
            reorderQty: product.reorderQty,
            isActive: product.isActive ? 1 : 0,
            isFeatured: product.isFeatured ? 1 : 0,
            hasVariants: product.hasVariants ? 1 : 0,
            weight: product.weight || null,
            dimensions: product.dimensions || null,
            tags: product.tags || null,
          }
        })

        console.log(`Created product: ${product.name}`)
        createdCount++
      } catch (error) {
        console.error(`Error creating product ${product.name}:`, error)
      }
    }

    console.log(`Created ${createdCount} products`)

    // ============================================
    // CREATE PRODUCT VARIANTS (sample)
    // ============================================
    console.log('Creating product variants...')

    const variantTemplates = [
      // Sarees with color variations
      {
        productId: 'prod-sa-001',
        sku: 'saree-sil-001',
        name: 'Silk Banarasi - Red',
        price: 8000,
        comparePrice: null,
        stock: 25,
        images: ['/images/products/saree-1.svg'],
        size: null,
        color: 'Red',
        material: 'Silk',
        isDefault: 1,
        isActive: 1,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
      },
      {
        productId: 'prod-sa-002',
        sku: 'saree-sil-002',
        name: 'Silk Banarasi - Green',
        price: 8000,
        comparePrice: null,
        stock: 25,
        images: ['/images/products/saree-1.svg'],
        size: null,
        color: 'Green',
        material: 'Silk',
        isDefault: 0,
        isActive: 1,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
      },
      {
        productId: 'prod-sa-003',
        sku: 'saree-sil-003',
        name: 'Silk Banarasi - Blue',
        price: 8000,
        comparePrice: null,
        stock: 20,
        images: ['/images/products/saree-1.svg'],
        size: null,
        color: 'Blue',
        material: 'Silk',
        isDefault: 0,
        isActive: 1,
        lowStockAlert: 10,
        reorderLevel: 5,
        reorderQty: 20,
      },
    ],
    ]

    // Create variants
    for (const variant of variantTemplates) {
      try {
        const createdVariant = await prisma.productVariant.create({
          data: {
            id: generateId('var'),
            productId: variant.productId,
            sku: variant.sku,
            name: variant.name,
            price: variant.price,
            comparePrice: variant.comparePrice,
            stock: variant.stock,
            images: JSON.stringify(variant.images),
            size: variant.size || null,
            color: variant.color || null,
            material: variant.material || null,
            isDefault: variant.isDefault ? 1 : 0,
            isActive: variant.isActive ? 1 : 0,
            lowStockAlert: variant.lowStockAlert,
            reorderLevel: variant.reorderLevel,
            reorderQty: variant.reorderQty,
          }
        })

        console.log(`Created variant: ${variant.name}`)
      } catch (error) {
        console.error(`Error creating variant: ${variant.name}:`, error)
      }
    }

    console.log(`Created ${variantTemplates.length} variants`)

    // ============================================
    // ADMIN USER
    // ============================================
    console.log('Creating admin user...')

    const adminUser = await prisma.user.create({
      data: {
        id: generateId('user-admin'),
        email: 'admin@scommerce.com',
        name: 'Admin User',
        password: '$2b$10$5y22htgQgUZVPkksz.6V1uY/TLQ9w.rkUX92xR4NWmB0jkiNa845u',
        role: 'admin',
        emailVerified: 1,
        createdAt: new Date(),
      }
    })

    console.log('Created admin user')

    // ============================================
    // STAFF USERS
    // ============================================
    console.log('Creating staff users...')

    const staffTemplates = [
      {
        email: 'rahul@scommerce.com',
        name: 'Rahul Sharma',
        phone: '+8801700000001',
        password: '$2b$10$5y22htgQgUZVPkksz.6V1uY/TLQ9w.rkUX92xR4NWmB0jkiNa845u',
        role: 'staff',
        emailVerified: 1,
        createdAt: new Date(),
      },
      {
        email: 'priya@scommerce.com',
        name: 'Priya Singh',
        phone: '+8801700000002',
        password: '$2b$10$eoee6iYh9VMesjluGRY9ROb9ArHRCDolSaHQR6L8yYRuC1LEjYeRC',
        role: 'staff',
        emailVerified: 1,
        createdAt: new Date(),
      },
      {
        email: 'amit@scommerce.com',
        name: 'Amit Kumar',
        phone: '+8801700000003',
        password: '$2b$10$q3CVc8GTq8O5ILjZxHvm.IF9QNuWjLmMRkOdNo8RZfkMoWbsrjUW',
        role: 'staff',
        emailVerified: 1,
        createdAt: new Date(),
      },
    ]

    for (const staff of staffTemplates) {
      try {
        await prisma.user.create({
          data: {
            id: generateId('user-staff'),
            email: staff.email,
            name: staff.name,
            phone: staff.phone,
            password: staff.password,
            role: 'staff',
            emailVerified: 1,
            createdAt: new Date(),
          }
        })
        console.log(`Created staff user: ${staff.name}`)
      } catch (error) {
        console.error(`Error creating staff: ${staff.name}:`, error)
      }
    }

    console.log(`Created ${staffTemplates.length} staff users`)

    // ============================================
    // SAMPLE CUSTOMER
    // ============================================
    console.log('Creating sample customer...')

    const customer = await prisma.user.create({
      data: {
        id: generateId('user-cust'),
        email: 'fatema@example.com',
        name: 'Fatema Akhter',
        phone: '+8801XXXXXXX',
        role: 'customer',
        emailVerified: 0,
        createdAt: new Date(),
      }
    })

    console.log('Created sample customer')

    // ============================================
    // SAMPLE ORDER
    // ============================================
    console.log('Creating sample order...')

    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@scommerce.com' }
    })

    const customer = await prisma.user.findFirst({
      where: { email: 'fatema@example.com' }
    })

    const product = await prisma.product.findFirst({
      where: { slug: 'prod-lh-001' }
    })

    if (!adminUser || !customer || !product) {
      console.log('Missing required data for sample order')
      return
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

    const order = await prisma.order.create({
      data: {
        id: generateId('order-001'),
        orderNumber,
        userId: customer?.id || adminUser.id,
        customerName: customer?.name || adminUser.name,
        customerEmail: customer?.email || adminUser.email,
        customerPhone: customer?.phone || adminUser.phone,
        shippingAddress: '123 Main St, Gulshan Avenue, Flat 5A',
        city: 'Dhaka',
        district: 'Dhanmondi',
        division: 'Dhaka',
        postalCode: '1216',
        subtotal: product.basePrice,
        shipping: 150,
        tax: 0,
        discount: 0,
        total: product.basePrice + 150,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'cod',
        createdAt: new Date(),
      }
    })

    console.log('Created sample order')

    console.log('Database seeded successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

main()
