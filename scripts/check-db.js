import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
    take: 10
  })
  console.log('Users:', JSON.stringify(users, null, 2))

  // Check admin users
  const adminUsers = await prisma.user.findMany({
    where: { role: { in: ['admin', 'staff'] } },
    select: { id: true, email: true, role: true }
  })
  console.log('Admin/Staff Users:', JSON.stringify(adminUsers, null, 2))

  // Check products
  const productCount = await prisma.product.count()
  console.log('Products count:', productCount)

  // Check orders
  const orderCount = await prisma.order.count()
  console.log('Orders count:', orderCount)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
