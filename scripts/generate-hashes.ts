import bcrypt from 'bcryptjs';

const passwords = [
  { email: 'admin@scommerce.com', password: 'admin123' },
  { email: 'rahul@scommerce.com', password: 'staff123' },
  { email: 'priya@scommerce.com', password: 'staff123' },
  { email: 'amit@scommerce.com', password: 'staff123' },
  { email: 'fatema@example.com', password: 'user123' },
  { email: 'noor@example.com', password: 'user123' },
  { email: 'sara@example.com', password: 'user123' },
  { email: 'zara@example.com', password: 'user123' },
  { email: 'hana@example.com', password: 'user123' },
];

async function generateHashes() {
  for (const { email, password } of passwords) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${email}: ${hash}`);
  }
}

generateHashes();
