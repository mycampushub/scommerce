/**
 * Field Mapping Utilities
 *
 * Provides standardized field name mappings between different layers:
 * - Database fields → API response fields
 * - Frontend form fields → Database fields
 * - Third-party API fields → Internal fields
 */

// ============== Product Field Mappings ==============

export const PRODUCT_FIELD_MAPPINGS = {
  // Database → API Response
  dbToApi: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    description: 'description',
    basePrice: 'price',
    comparePrice: 'originalPrice',
    costPrice: 'costPrice',
    images: 'images',
    stock: 'stock',
    categoryId: 'categoryId',
    isActive: 'isActive',
    isFeatured: 'isFeatured',
    hasVariants: 'hasVariants',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  // API Request → Database
  apiToDb: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    description: 'description',
    price: 'basePrice',
    originalPrice: 'comparePrice',
    costPrice: 'costPrice',
    images: 'images',
    stock: 'stock',
    categoryId: 'categoryId',
    isActive: 'isActive',
    isFeatured: 'isFeatured',
    hasVariants: 'hasVariants',
  },
} as const;

// ============== Order Field Mappings ==============

export const ORDER_FIELD_MAPPINGS = {
  // Database → API Response
  dbToApi: {
    id: 'id',
    orderNumber: 'orderNumber',
    userId: 'userId',
    customerName: 'customerName',
    customerEmail: 'customerEmail',
    customerPhone: 'customerPhone',
    shippingAddress: 'shippingAddress',
    billingAddress: 'billingAddress',
    paymentMethod: 'paymentMethod',
    paymentStatus: 'paymentStatus',
    orderStatus: 'status',
    subtotal: 'subtotal',
    shipping: 'shipping',
    tax: 'tax',
    discount: 'discount',
    total: 'total',
    notes: 'notes',
    trackingNumber: 'trackingNumber',
    trackingStatus: 'trackingStatus',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  // API Request → Database
  apiToDb: {
    id: 'id',
    orderNumber: 'orderNumber',
    userId: 'userId',
    customerName: 'customerName',
    customerEmail: 'customerEmail',
    customerPhone: 'customerPhone',
    shippingAddress: 'shippingAddress',
    billingAddress: 'billingAddress',
    paymentMethod: 'paymentMethod',
    paymentStatus: 'paymentStatus',
    status: 'orderStatus',
    subtotal: 'subtotal',
    shipping: 'shipping',
    tax: 'tax',
    discount: 'discount',
    total: 'total',
    notes: 'notes',
    trackingNumber: 'trackingNumber',
    trackingStatus: 'trackingStatus',
  },
} as const;

// ============== User Field Mappings ==============

export const USER_FIELD_MAPPINGS = {
  // Database → API Response
  dbToApi: {
    id: 'id',
    email: 'email',
    name: 'name',
    firstName: 'firstName',
    lastName: 'lastName',
    phone: 'phone',
    role: 'role',
    isActive: 'isActive',
    emailVerified: 'emailVerified',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  // API Request → Database
  apiToDb: {
    id: 'id',
    email: 'email',
    name: 'name',
    firstName: 'firstName',
    lastName: 'lastName',
    phone: 'phone',
    role: 'role',
    isActive: 'isActive',
    emailVerified: 'emailVerified',
  },
} as const;

// ============== Cart Item Field Mappings ==============

export const CART_ITEM_FIELD_MAPPINGS = {
  // Database → API Response
  dbToApi: {
    id: 'id',
    productId: 'id', // Cart items use product ID as ID in responses
    variantId: 'variantId',
    quantity: 'quantity',
    productName: 'name',
    productPrice: 'price',
    productImage: 'image',
    variantSku: 'variantSku',
    variantSize: 'size',
    variantColor: 'color',
    variantMaterial: 'material',
  },
  // API Request → Database
  apiToDb: {
    id: 'productId',
    productId: 'productId',
    variantId: 'variantId',
    quantity: 'quantity',
    name: 'productName',
    price: 'productPrice',
    image: 'productImage',
    variantSku: 'variantSku',
    size: 'variantSize',
    color: 'variantColor',
    material: 'variantMaterial',
  },
} as const;

// ============== Price Field Mappings ==============

export const PRICE_FIELD_MAPPINGS = {
  // Standardize price field names across the application
  basePrice: ['price', 'basePrice', 'unitPrice', 'sellingPrice'],
  comparePrice: ['originalPrice', 'comparePrice', 'listPrice', 'mrp'],
  costPrice: ['costPrice', 'wholesalePrice', 'purchasePrice'],
  totalPrice: ['total', 'totalPrice', 'amount'],
} as const;

// ============== Helper Functions ==============

/**
 * Transform an object's keys from one mapping to another
 */
export function transformFields<T = Record<string, unknown>>(
  obj: Record<string, unknown>,
  mapping: Record<string, string>
): T {
  const result: Record<string, unknown> = {};

  for (const [sourceKey, targetKey] of Object.entries(mapping)) {
    if (sourceKey in obj && obj[sourceKey] !== undefined) {
      result[targetKey] = obj[sourceKey];
    }
  }

  return result as T;
}

/**
 * Get the standardized price field name
 */
export function getPriceFieldName(fieldName: string): 'basePrice' | 'comparePrice' | 'costPrice' | 'totalPrice' | null {
  for (const [standard, variants] of Object.entries(PRICE_FIELD_MAPPINGS)) {
    if ((variants as readonly string[]).includes(fieldName)) {
      return standard as 'basePrice' | 'comparePrice' | 'costPrice' | 'totalPrice';
    }
  }
  return null;
}

/**
 * Normalize price fields in an object to standard names
 */
export function normalizePriceFields(obj: Record<string, unknown>): Record<string, unknown> {
  const result = { ...obj };

  for (const [key, value] of Object.entries(obj)) {
    const standardName = getPriceFieldName(key);
    if (standardName && !result[standardName]) {
      result[standardName] = value;
    }
  }

  return result;
}

/**
 * Map database result to API response format for products
 */
export function mapProductToApiResponse(product: Record<string, unknown>): Record<string, unknown> {
  return transformFields(product, PRODUCT_FIELD_MAPPINGS.dbToApi);
}

/**
 * Map API request to database format for products
 */
export function mapProductToDbFormat(data: Record<string, unknown>): Record<string, unknown> {
  return transformFields(data, PRODUCT_FIELD_MAPPINGS.apiToDb);
}

/**
 * Map database result to API response format for orders
 */
export function mapOrderToApiResponse(order: Record<string, unknown>): Record<string, unknown> {
  return transformFields(order, ORDER_FIELD_MAPPINGS.dbToApi);
}

/**
 * Map API request to database format for orders
 */
export function mapOrderToDbFormat(data: Record<string, unknown>): Record<string, unknown> {
  return transformFields(data, ORDER_FIELD_MAPPINGS.apiToDb);
}

/**
 * Map database result to API response format for users
 */
export function mapUserToApiResponse(user: Record<string, unknown>): Record<string, unknown> {
  return transformFields(user, USER_FIELD_MAPPINGS.dbToApi);
}

/**
 * Map API request to database format for users
 */
export function mapUserToDbFormat(data: Record<string, unknown>): Record<string, unknown> {
  return transformFields(data, USER_FIELD_MAPPINGS.apiToDb);
}

/**
 * Map database result to API response format for cart items
 */
export function mapCartItemToApiResponse(item: Record<string, unknown>): Record<string, unknown> {
  return transformFields(item, CART_ITEM_FIELD_MAPPINGS.dbToApi);
}

/**
 * Map API request to database format for cart items
 */
export function mapCartItemToDbFormat(data: Record<string, unknown>): Record<string, unknown> {
  return transformFields(data, CART_ITEM_FIELD_MAPPINGS.apiToDb);
}
