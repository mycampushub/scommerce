import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { queryAll } from '@/db/db';

export async function GET() {
  try {
    const env = await getEnv();

    if (!env || !env.DB) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 });
    }

    // Get all cart items (for debugging only)
    const cartItems = await queryAll<any>(
      env,
      'SELECT * FROM cart_items ORDER BY createdAt DESC LIMIT 20'
    );

    // Get user info for context
    const users = await queryAll<any>(
      env,
      'SELECT id, email, name FROM users LIMIT 10'
    );

    return NextResponse.json({
      success: true,
      data: {
        cartItems,
        users,
        cartItemCount: cartItems.length,
      }
    });
  } catch (error) {
    console.error('[Debug Cart] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debug data' },
      { status: 500 }
    );
  }
}