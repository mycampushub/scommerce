import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Prisma database seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@scommerce.com' },
    update: {},
    create: {
      id: 'user-admin-001',
      email: 'admin@scommerce.com',
      name: 'Admin User',
      phone: '+8801700000001',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  // Create staff users
  const staffPassword = await bcrypt.hash('staff123', 10)

  const staff1 = await prisma.user.upsert({
    where: { email: 'rahul@scommerce.com' },
    update: {},
    create: {
      id: 'user-staff-001',
      email: 'rahul@scommerce.com',
      name: 'Rahul Sharma',
      phone: '+8801700000002',
      password: staffPassword,
      role: 'STAFF',
      emailVerified: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  const staff2 = await prisma.user.upsert({
    where: { email: 'priya@scommerce.com' },
    update: {},
    create: {
      id: 'user-staff-002',
      email: 'priya@scommerce.com',
      name: 'Priya Singh',
      phone: '+8801700000003',
      password: staffPassword,
      role: 'STAFF',
      emailVerified: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  const staff3 = await prisma.user.upsert({
    where: { email: 'amit@scommerce.com' },
    update: {},
    create: {
      id: 'user-staff-003',
      email: 'amit@scommerce.com',
      name: 'Amit Kumar',
      phone: '+8801700000004',
      password: staffPassword,
      role: 'STAFF',
      emailVerified: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  // Create customer users
  const userPassword = await bcrypt.hash('user123', 10)

  const user1 = await prisma.user.upsert({
    where: { email: 'fatema@example.com' },
    update: {},
    create: {
      id: 'user-cust-001',
      email: 'fatema@example.com',
      name: 'Fatema Akhter',
      phone: '+8801700000101',
      password: userPassword,
      role: 'USER',
      emailVerified: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'noor@example.com' },
    update: {},
    create: {
      id: 'user-cust-002',
      email: 'noor@example.com',
      name: 'Noor Jahan',
      phone: '+8801700000102',
      password: userPassword,
      role: 'USER',
      emailVerified: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'sara@example.com' },
    update: {},
    create: {
      id: 'user-cust-003',
      email: 'sara@example.com',
      name: 'Sara Ahmed',
      phone: '+8801700000103',
      password: userPassword,
      role: 'USER',
      emailVerified: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  const user4 = await prisma.user.upsert({
    where: { email: 'zara@example.com' },
    update: {},
    create: {
      id: 'user-cust-004',
      email: 'zara@example.com',
      name: 'Zara Khan',
      phone: '+8801700000104',
      password: userPassword,
      role: 'USER',
      emailVerified: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  const user5 = await prisma.user.upsert({
    where: { email: 'hana@example.com' },
    update: {},
    create: {
      id: 'user-cust-005',
      email: 'hana@example.com',
      name: 'Hana Begum',
      phone: '+8801700000105',
      password: userPassword,
      role: 'USER',
      emailVerified: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log('Created users:')
  console.log(`  - Admin: ${admin.email} / admin123`)
  console.log(`  - Staff: ${staff1.email} / staff123`)
  console.log(`  - Staff: ${staff2.email} / staff123`)
  console.log(`  - Staff: ${staff3.email} / staff123`)
  console.log(`  - User: ${user1.email} / user123`)
  console.log(`  - User: ${user2.email} / user123`)
  console.log(`  - User: ${user3.email} / user123`)
  console.log(`  - User: ${user4.email} / user123`)
  console.log(`  - User: ${user5.email} / user123`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
