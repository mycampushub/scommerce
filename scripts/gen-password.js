import bcrypt from 'bcryptjs'

const passwords = {
  'admin123': 'admin@scommerce.com',
  'user123': 'fatema@example.com'
}

for (const [password, email] of Object.entries(passwords)) {
  const hash = await bcrypt.hash(password, 10)
  console.log(`${email} -> ${password}:`)
  console.log(hash)
  console.log()
}
