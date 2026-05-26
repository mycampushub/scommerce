import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { UserRepository } from '@/db/user.repository';
import { logAdminAction } from '@/lib/audit-logger';
import { count } from '@/db/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin only - staff cannot delete users)
  const userOrResponse = await verifyAdminAuth(request, ['admin']);
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse;
  }

  const admin = userOrResponse as { id: string; email: string; role: string; name?: string };

  try {
    const env = await getEnv();
    const { id } = await params;

    // Check if user exists
    const user = await UserRepository.findById(env, id);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Prevent deleting the current admin
    if (id === admin.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete your own account',
        },
        { status: 400 }
      );
    }

    // Check if user has any orders
    const isPrisma = !env || !env.DB;
    let orderCount = 0;

    if (isPrisma) {
      const { getPrisma } = await import('@/db/unified-db');
      const prisma = getPrisma();
      orderCount = await prisma.orders.count({
        where: { userId: id }
      });
    } else {
      orderCount = await count(env, 'orders', 'WHERE userId = ?', id);
    }

    if (orderCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete user with ${orderCount} order(s). Please delete or archive orders first.`,
          orderCount,
        },
        { status: 400 }
      );
    }

    // Delete user (cascade will handle related records: addresses, cart_items, wishlist_items, etc.)
    await UserRepository.delete(env, id);

    // Log audit event
    await logAdminAction(
      env,
      request,
      admin.id,
      'DELETE',
      'User',
      id,
      `Deleted user: ${user.email} (ID: ${id})`
    );

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
