#!/usr/bin/env node

/**
 * Migration script to update product image references
 * Converts JPG references to SVG references
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateImageReferences() {
  try {
    console.log('Starting image reference migration...')
    
    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        images: true
      }
    })

    let updatedCount = 0

    for (const product of products) {
      let images = product.images
      let needsUpdate = false

      // Parse images array
      if (images) {
        try {
          let parsedImages
          if (typeof images === 'string') {
            parsedImages = JSON.parse(images)
          } else if (Array.isArray(images)) {
            parsedImages = images
          } else {
            parsedImages = []
          }

          // Update each image path
          const updatedImages = parsedImages.map((img, index) => {
            // If it's a JPG reference that doesn't exist, change to SVG
            if (img.endsWith('.jpg') && index === 0) {
              const baseName = img.replace('/images/products/', '').replace('.jpg', '')
              const svgPath = `/images/products/${baseName}.svg`
              console.log(`Updating ${product.name}: ${img} → ${svgPath}`)
              needsUpdate = true
              return svgPath
            }
            return img
          })

          if (needsUpdate) {
            images = JSON.stringify(updatedImages)
            
            // Update database
            await prisma.product.update({
              where: { id: product.id },
              data: { images }
            })
            
            updatedCount++
          }
        } catch (error) {
          console.error(`Error processing product ${product.name}:`, error)
        }
      }
    }
    
    console.log(`Migration complete. Updated ${updatedCount} products.`)
    return updatedCount
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateImageReferences()
  .then((count) => {
    console.log(`Successfully updated ${count} product image references`)
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
