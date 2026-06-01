// Script to seed featured brands if they don't exist
import { db } from '@/lib/db'

async function seedFeaturedBrands() {
  console.log('Checking for featured brands...')

  try {
    // Check if we have any featured brands
    const featuredBrands = await db.brands.findMany({
      where: {
        featured: 1,
        isActive: 1
      }
    })

    console.log(`Found ${featuredBrands.length} featured brands`)

    if (featuredBrands.length === 0) {
      console.log('No featured brands found, creating sample brands...')

      const brands = [
        {
          name: 'Luxury Sarees',
          slug: 'luxury-sarees',
          description: 'Premium quality silk sarees from across India',
          website: 'https://example.com',
          country: 'India',
          isActive: 1,
          featured: 1,
          sortOrder: 1
        },
        {
          name: 'Modern Fashion',
          slug: 'modern-fashion',
          description: 'Contemporary ethnic wear for the modern woman',
          website: 'https://example.com',
          country: 'Bangladesh',
          isActive: 1,
          featured: 1,
          sortOrder: 2
        },
        {
          name: 'Elegant Style',
          slug: 'elegant-style',
          description: 'Traditional elegance meets modern sophistication',
          website: 'https://example.com',
          country: 'Pakistan',
          isActive: 1,
          featured: 1,
          sortOrder: 3
        },
        {
          name: 'Royal Collection',
          slug: 'royal-collection',
          description: 'Luxury bridal and wedding wear',
          website: 'https://example.com',
          country: 'India',
          isActive: 1,
          featured: 1,
          sortOrder: 4
        }
      ]

      for (const brand of brands) {
        try {
          await db.brands.create({
            data: brand
          })
          console.log(`✓ Created brand: ${brand.name}`)
        } catch (error: any) {
          if (error.code === 'P2002') {
            console.log(`- Brand "${brand.name}" already exists, updating to featured...`)
            await db.brands.update({
              where: { slug: brand.slug },
              data: { featured: 1, isActive: 1, sortOrder: brand.sortOrder }
            })
          } else {
            console.error(`✗ Error creating brand ${brand.name}:`, error.message)
          }
        }
      }

      console.log('✓ Featured brands created successfully!')
    } else {
      console.log('✓ Featured brands already exist:')
      featuredBrands.forEach(brand => {
        console.log(`  - ${brand.name} (${brand.slug})`)
      })
    }

    // Check all brands
    const allBrands = await db.brands.findMany({
      orderBy: { sortOrder: 'asc' }
    })

    console.log(`\nTotal brands in database: ${allBrands.length}`)
    allBrands.forEach(brand => {
      const status = brand.isActive ? 'Active' : 'Inactive'
      const featured = brand.featured ? 'Featured' : 'Standard'
      console.log(`  [${status}] [${featured}] ${brand.name} (${brand.slug})`)
    })

  } catch (error) {
    console.error('Error seeding featured brands:', error)
    process.exit(1)
  }

  process.exit(0)
}

seedFeaturedBrands()