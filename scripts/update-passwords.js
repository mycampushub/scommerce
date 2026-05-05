import Database from 'better-sqlite3'
import { join } from 'path'

const dbPath = join(process.cwd(), 'db/custom.db')
const db = new Database(dbPath)

// Update admin password
db.prepare(`
  UPDATE User
  SET password = ?
  WHERE email = ?
`).run('$2b$10$h3CAaGRZQudxIw2S0nN7C.f9mdYz3VlkMZXIAJUO2hBjQFXf2w54C', 'admin@scommerce.com')

// Update fatema password
db.prepare(`
  UPDATE User
  SET password = ?
  WHERE email = ?
`).run('$2b$10$DuUoulG2FLmTa8iPqD3KiOLYg1.PgnS/ha1/oDc5uaOZgfOARznEG', 'fatema@example.com')

// Update all other user passwords to user123
db.prepare(`
  UPDATE User
  SET password = ?
  WHERE email != ?
`).run('$2b$10$DuUoulG2FLmTa8iPqD3KiOLYg1.PgnS/ha1/oDc5uaOZgfOARznEG', 'admin@scommerce.com')

console.log('Passwords updated successfully!')

// Verify
const users = db.prepare('SELECT email, role FROM User').all()
console.log('Users in database:', users)
