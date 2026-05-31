import { Database } from 'bun:sqlite';

const db = new Database('db/custom.db');

// Check if brands table exists
const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='brands'").all();
console.log('Tables:', tables);

// Check brands count
try {
  const count = db.query('SELECT COUNT(*) as count FROM brands').get();
  console.log('Brands count:', count);

  // Check if any featured brands
  const featured = db.query('SELECT * FROM brands WHERE featured = 1').all();
  console.log('Featured brands count:', featured.length);

  if (featured.length > 0) {
    console.log('Featured brands list:', featured.map((b: any) => b.name));
  }

  // Insert featured brands if none exist
  if (!featured.length) {
    console.log('No featured brands found, inserting sample brands...');

    const brands = [
      {
        id: 'brand-001',
        name: 'Luxury Sarees',
        slug: 'luxury-sarees',
        description: 'Premium quality silk sarees from across India',
        website: 'https://example.com',
        country: 'India',
        isActive: 1,
        featured: 1,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'brand-002',
        name: 'Modern Fashion',
        slug: 'modern-fashion',
        description: 'Contemporary ethnic wear for the modern woman',
        website: 'https://example.com',
        country: 'Bangladesh',
        isActive: 1,
        featured: 1,
        sortOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'brand-003',
        name: 'Elegant Style',
        slug: 'elegant-style',
        description: 'Traditional elegance meets modern sophistication',
        website: 'https://example.com',
        country: 'Pakistan',
        isActive: 1,
        featured: 1,
        sortOrder: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'brand-004',
        name: 'Royal Collection',
        slug: 'royal-collection',
        description: 'Luxury bridal and wedding wear',
        website: 'https://example.com',
        country: 'India',
        isActive: 1,
        featured: 1,
        sortOrder: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const insert = db.prepare(`
      INSERT OR IGNORE INTO brands (id, name, slug, description, website, country, isActive, featured, sortOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const brand of brands) {
      try {
        insert.run(
          brand.id,
          brand.name,
          brand.slug,
          brand.description,
          brand.website,
          brand.country,
          brand.isActive,
          brand.featured,
          brand.sortOrder,
          brand.createdAt,
          brand.updatedAt
        );
        console.log(`✓ Inserted brand: ${brand.name}`);
      } catch (e: any) {
        console.log(`- Brand "${brand.name}" already exists or error: ${e.message}`);
      }
    }
  }
} catch (e: any) {
  console.log('Error querying brands:', e.message);
}

db.close();