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

  // Execute the entire seed file
  await db.exec(sql)

  console.log('Database seeded successfully!')

  // Get counts
  const cats = db.prepare('SELECT COUNT(*) as count FROM Category').all()
  const prods = db.prepare('SELECT COUNT(*) as count FROM Product').all()
  const users = db.prepare('SELECT COUNT(*) as count FROM User').all()
  console.log(`Users: ${users[0]?.count}`)
  console.log(`Categories: ${cats[0]?.count}`)
  console.log(`Products: ${prods[0]?.count}`)
}

main().catch(console.error)
