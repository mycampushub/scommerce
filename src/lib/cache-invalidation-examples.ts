/**
 * Service Worker Cache Invalidation Examples
 *
 * This file contains examples of how to use cache invalidation
 * after performing mutations in your components.
 */

import {
  invalidateCartCache,
  invalidateWishlistCache,
  invalidateOrdersCache,
  invalidateProductCache,
  invalidateCategoryCache,
  invalidateStaticCache,
  mutateWithCacheInvalidation,
} from '@/lib/service-worker-cache';

/**
 * Example 1: Add to cart with cache invalidation
 *
 * In your cart component or any component that adds items to cart:
 */
export async function addToCartWithInvalidation(item: {
  productId: string;
  quantity: number;
  variantId?: string;
}) {
  try {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        item,
      }),
    });

    if (!response.ok) throw new Error('Failed to add to cart');

    // Invalidate cart cache to ensure fresh data
    await invalidateCartCache();

    return await response.json();
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

/**
 * Example 2: Update cart with cache invalidation using helper
 */
export async function updateCartWithInvalidation(item: {
  productId: string;
  quantity: number;
  variantId?: string;
}) {
  return await mutateWithCacheInvalidation(
    async () => {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          item,
        }),
      });

      if (!response.ok) throw new Error('Failed to update cart');
      return await response.json();
    },
    invalidateCartCache
  );
}

/**
 * Example 3: Remove from cart with cache invalidation
 */
export async function removeFromCart(productId: string, variantId?: string) {
  try {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'remove',
        item: { productId, variantId },
      }),
    });

    if (!response.ok) throw new Error('Failed to remove from cart');

    await invalidateCartCache();
    return await response.json();
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

/**
 * Example 4: Add to wishlist with cache invalidation
 */
export async function addToWishlist(productId: string) {
  return await mutateWithCacheInvalidation(
    async () => {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) throw new Error('Failed to add to wishlist');
      return await response.json();
    },
    invalidateWishlistCache
  );
}

/**
 * Example 5: Remove from wishlist with cache invalidation
 */
export async function removeFromWishlist(productId: string) {
  return await mutateWithCacheInvalidation(
    async () => {
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove from wishlist');
      return await response.json();
    },
    invalidateWishlistCache
  );
}

/**
 * Example 6: Create order with cache invalidation
 */
export async function createOrder(orderData: {
  items: any[];
  shippingAddress: any;
  paymentMethod: string;
}) {
  return await mutateWithCacheInvalidation(
    async () => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error('Failed to create order');
      return await response.json();
    },
    invalidateOrdersCache
  );
}

/**
 * Example 7: Cancel order with cache invalidation
 */
export async function cancelOrder(orderId: string) {
  return await mutateWithCacheInvalidation(
    async () => {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to cancel order');
      return await response.json();
    },
    invalidateOrdersCache
  );
}

/**
 * Example 8: Admin: Update product with cache invalidation
 */
export async function updateProduct(
  productId: string,
  productData: any
) {
  return await mutateWithCacheInvalidation(
    async () => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) throw new Error('Failed to update product');
      return await response.json();
    },
    () => invalidateProductCache(productId)
  );
}

/**
 * Example 9: Admin: Update category with cache invalidation
 */
export async function updateCategory(
  categoryId: string,
  categoryData: any
) {
  return await mutateWithCacheInvalidation(
    async () => {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) throw new Error('Failed to update category');
      return await response.json();
    },
    invalidateCategoryCache
  );
}

/**
 * Example 10: Admin: Update banner with cache invalidation
 */
export async function updateBanner(
  bannerId: string,
  bannerData: any
) {
  return await mutateWithCacheInvalidation(
    async () => {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) throw new Error('Failed to update banner');
      return await response.json();
    },
    invalidateStaticCache
  );
}

/**
 * Example 11: Component-level cache invalidation
 *
 * In your React component, you can invalidate cache after mutations:
 */
export function cartMutationExamples() {
  // Example in a component:
  const handleAddToCart = async (item: any) => {
    try {
      // Add item to cart
      await addToCartWithInvalidation(item);

      // Or use the React Query hook that automatically invalidates cache
      // await useAddToCart().mutateAsync(item);

      console.log('Item added to cart');
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  };

  const handleRemoveFromCart = async (productId: string) => {
    try {
      await removeFromCart(productId);
      console.log('Item removed from cart');
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
    }
  };

  const handleClearCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });

      if (response.ok) {
        await invalidateCartCache();
        console.log('Cart cleared');
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  return { handleAddToCart, handleRemoveFromCart, handleClearCart };
}

/**
 * Example 12: Using with React Query mutations
 *
 * If you're using React Query, you can integrate cache invalidation
 * with the onSuccess callback:
 */
export function reactQueryMutationExample() {
  // Example mutation with React Query:
  /*
  const addMutation = useMutation({
    mutationFn: async (item: any) => {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', item }),
      });
      return response.json();
    },
    onSuccess: async () => {
      // Invalidate cart cache
      await invalidateCartCache();
      // Also invalidate React Query cache if needed
      queryClient.invalidateQueries(['cart']);
    },
  });
  */

  return null;
}

/**
 * Example 13: Batch invalidation after multiple mutations
 */
export async function syncCartAndWishlist() {
  try {
    // Sync cart
    const cartResponse = await fetch('/api/cart/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });

    // Sync wishlist
    const wishlistResponse = await fetch('/api/wishlist/sync', {
      method: 'POST',
    });

    if (cartResponse.ok && wishlistResponse.ok) {
      // Invalidate both caches
      await Promise.all([
        invalidateCartCache(),
        invalidateWishlistCache(),
      ]);
    }
  } catch (error) {
    console.error('Failed to sync cart and wishlist:', error);
    throw error;
  }
}

/**
 * Example 14: Manual cache invalidation for custom patterns
 */
import { invalidateCache } from '@/lib/service-worker-cache';

export async function invalidateCustomPattern() {
  // Invalidate all product-related caches
  await invalidateCache({ pattern: '/api/products/.*' });

  // Invalidate specific endpoint
  await invalidateCache({ url: '/api/categories' });

  // Invalidate all caches
  await invalidateCache({ invalidateAll: true });
}
