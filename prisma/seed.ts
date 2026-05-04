import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const dbPath = join(__dirname, '../db/custom.db')
  const sqlPath = join(__dirname, '../db/seed.sql')

  const db = new Database(dbPath)
  const sql = readFileSync(sqlPath, 'utf-8')

  // Remove CREATE TABLE statements since tables already exist
  const insertOnly = sql.split('-- ============================================')
    .map(section => {
      if (section.includes('-- INSERT')) {
        return section
      }
      return null
    })
    .filter(Boolean)
    .join('\n')

  await db.exec(insertOnly)

  console.log('Database seeded successfully!')

  // Get counts
  const cats = await db.query('SELECT COUNT(*) as count FROM categories')
  const prods = await db.query('SELECT COUNT(*) as count FROM products')
  console.log(`Categories: ${cats[0]?.count}`)
  console.log(`Products: ${prods[0]?.count}`)
}

main().catch(console.error)
