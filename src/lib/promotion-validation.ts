import { parseJSON } from '@/db/db';
import { runTransactionWithRetry } from '@/lib/transaction';

export interface PromoCodeValidationResult {
  valid: boolean;
  promotion?: any;
  discountAmount?: number;
  error?: string;
}

export interface ValidatePromoCodeParams {
  promoCode: string;
  subtotal: number;
  userId?: string;
  cartItems?: Array<{ productId: string; variantId?: string; quantity: number }>;
}

/**
 * Validate a promo code against promotion rules
 */
export async function validatePromoCode(
  env: any,
  params: ValidatePromoCodeParams
): Promise<PromoCodeValidationResult> {
  const { promoCode, subtotal, userId, cartItems } = params;

  // Find active promotion with this code
  const promotion = await env.DB.prepare(
    `SELECT * FROM promotions
     WHERE promoCode = ?
       AND (type = 'coupon' OR type = 'discount_code')
       AND isActive = 1
     LIMIT 1`
  )
    .bind(promoCode.toUpperCase())
    .first();

  if (!promotion) {
    return {
      valid: false,
      error: 'Invalid promo code',
    };
  }

  // Check date range
  const now = new Date();
  const startDate = promotion.startDate ? new Date(promotion.startDate) : null;
  const endDate = promotion.endDate ? new Date(promotion.endDate) : null;

  if (startDate && now < startDate) {
    return {
      valid: false,
      error: 'Promo code is not yet valid',
    };
  }

  if (endDate && now > endDate) {
    return {
      valid: false,
      error: 'Promo code has expired',
    };
  }

  // Check usage limit (NOTE: This is just a preliminary check.
  // The actual atomic increment happens in incrementPromoUsage)
  if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
    return {
      valid: false,
      error: 'Promo code has reached its usage limit',
    };
  }

  // Check per-user usage limit
  if (promotion.userLimit && userId) {
    const userUsage = await env.DB.prepare(
      `SELECT COUNT(*) as count
       FROM orders
       WHERE promoCode = ?
         AND userId = ?
         AND status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED')`
    )
      .bind(promoCode, userId)
      .first();

    if ((userUsage?.count as number) >= promotion.userLimit) {
      return {
        valid: false,
        error: `You have reached the usage limit for this promo code (${promotion.userLimit} times)`,
      };
    }
  }

  // Check minimum order amount
  if (promotion.minOrderAmount && subtotal < promotion.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order amount of ${promotion.minOrderAmount} required`,
    };
  }

  // Check product/category applicability
  if (promotion.applicableProducts || promotion.applicableCategories) {
    const applicableProductIds = promotion.applicableProducts
      ? parseJSON<string[]>(promotion.applicableProducts) || []
      : [];

    const applicableCategoryIds = promotion.applicableCategories
      ? parseJSON<string[]>(promotion.applicableCategories) || []
      : [];

    // Get product categories for cart items
    if (cartItems && cartItems.length > 0) {
      const hasApplicableItem = await checkCartApplicability(
        env,
        cartItems,
        applicableProductIds,
        applicableCategoryIds
      );

      if (!hasApplicableItem) {
        return {
          valid: false,
          error: 'Promo code is not applicable to any items in your cart',
        };
      }
    }
  }

  // Calculate discount
  let discountAmount = 0;

  if (promotion.discountType === 'percentage') {
    discountAmount = (subtotal * (promotion.discountValue || 0)) / 100;

    // Apply max discount cap
    if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
      discountAmount = promotion.maxDiscountAmount;
    }
  } else if (promotion.discountType === 'fixed' || promotion.discountType === 'fixed_amount') {
    discountAmount = promotion.discountValue || 0;
  } else if (promotion.discountType === 'buy_x_get_y') {
    // Complex discount type - handle in separate logic
    // For now, return the promotion for the UI to handle
    return {
      valid: true,
      promotion,
      error: 'This promotion requires special handling',
    };
  }

  // Ensure discount doesn't exceed subtotal
  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  return {
    valid: true,
    promotion,
    discountAmount,
  };
}

/**
 * Check if cart has any applicable items for the promo
 */
async function checkCartApplicability(
  env: any,
  cartItems: Array<{ productId: string; variantId?: string; quantity: number }>,
  applicableProductIds: string[],
  applicableCategoryIds: string[]
): Promise<boolean> {
  for (const item of cartItems) {
    // Check if product is directly applicable
    if (applicableProductIds.includes(item.productId)) {
      // Verify product has a valid price
      const product = await env.DB.prepare(
        'SELECT id, price, basePrice, isActive FROM products WHERE id = ? LIMIT 1'
      )
        .bind(item.productId)
        .first();

      // Skip if product not found, inactive, or has no valid price
      if (!product || !product.isActive) continue;
      const productPrice = product.basePrice || product.price;
      if (!productPrice || productPrice <= 0) continue;

      return true;
    }

    // Check if product category is applicable
    if (applicableCategoryIds.length > 0) {
      const product = await env.DB.prepare(
        'SELECT categoryId, price, basePrice, isActive FROM products WHERE id = ? LIMIT 1'
      )
        .bind(item.productId)
        .first();

      if (!product || !product.isActive) continue;

      // Verify product has a valid price
      const productPrice = product.basePrice || product.price;
      if (!productPrice || productPrice <= 0) continue;

      if (product && applicableCategoryIds.includes(product.categoryId)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Increment usage count for a promo code after successful order
 * This uses an atomic UPDATE to prevent race conditions
 * Returns false if the usage limit has been exceeded
 */
export async function incrementPromoUsage(
  env: any,
  promoCode: string
): Promise<boolean> {
  // Use atomic UPDATE with condition to prevent race condition
  const result = await env.DB.prepare(
    `UPDATE promotions
     SET usedCount = usedCount + 1
     WHERE promoCode = ?
       AND (usageLimit IS NULL OR usedCount < usageLimit)`
  )
    .bind(promoCode)
    .run();

  // Check if any row was updated
  // If usageLimit was reached, no row will be updated
  return (result.meta?.changes || 0) > 0;
}

/**
 * Get all active promo codes for a user
 */
export async function getUserPromoCodes(
  env: any,
  userId?: string
): Promise<any[]> {
  const promotions = await env.DB.prepare(
    `SELECT p.*,
       (CASE WHEN p.userLimit > 0 THEN
         (SELECT COUNT(*) FROM orders WHERE promoCode = p.promoCode AND userId = ?)
       ELSE 0 END) as userUsageCount
     FROM promotions p
     WHERE (p.type = 'coupon' OR p.type = 'discount_code')
       AND p.isActive = 1
       AND (p.startDate IS NULL OR p.startDate <= datetime('now'))
       AND (p.endDate IS NULL OR p.endDate >= datetime('now'))
       AND (p.usageLimit IS NULL OR p.usedCount < p.usageLimit)
     ORDER BY p.createdAt DESC`
  )
    .bind(userId || '')
    .all();

  return promotions.results || [];
}
