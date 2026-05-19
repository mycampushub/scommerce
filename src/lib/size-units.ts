/**
 * Size Units Configuration
 * Code-based configuration (NOT in Settings)
 * Used across Products and Inventory forms
 */

export interface SizeUnit {
  code: string;
  name: string;
  symbol: string;
  category: 'volume' | 'weight' | 'quantity' | 'length' | 'clothing';
  baseUnit?: string;
  conversion?: number;
}

export const SIZE_UNITS: SizeUnit[] = [
  // Volume units
  {
    code: 'ml',
    name: 'Milliliter',
    symbol: 'ml',
    category: 'volume',
    baseUnit: 'l',
    conversion: 0.001,
  },
  {
    code: 'l',
    name: 'Liter',
    symbol: 'L',
    category: 'volume',
    baseUnit: 'l',
    conversion: 1.0,
  },
  {
    code: 'floz',
    name: 'Fluid Ounce',
    symbol: 'fl oz',
    category: 'volume',
    baseUnit: 'l',
    conversion: 0.0295735,
  },
  {
    code: 'gal',
    name: 'Gallon',
    symbol: 'gal',
    category: 'volume',
    baseUnit: 'l',
    conversion: 3.78541,
  },

  // Weight units
  {
    code: 'mg',
    name: 'Milligram',
    symbol: 'mg',
    category: 'weight',
    baseUnit: 'g',
    conversion: 0.001,
  },
  {
    code: 'g',
    name: 'Gram',
    symbol: 'g',
    category: 'weight',
    baseUnit: 'g',
    conversion: 1.0,
  },
  {
    code: 'kg',
    name: 'Kilogram',
    symbol: 'kg',
    category: 'weight',
    baseUnit: 'g',
    conversion: 1000.0,
  },
  {
    code: 'oz',
    name: 'Ounce',
    symbol: 'oz',
    category: 'weight',
    baseUnit: 'g',
    conversion: 28.3495,
  },
  {
    code: 'lb',
    name: 'Pound',
    symbol: 'lb',
    category: 'weight',
    baseUnit: 'g',
    conversion: 453.592,
  },

  // Quantity units
  {
    code: 'pc',
    name: 'Piece',
    symbol: 'pc',
    category: 'quantity',
  },
  {
    code: 'set',
    name: 'Set',
    symbol: 'set',
    category: 'quantity',
  },
  {
    code: 'pair',
    name: 'Pair',
    symbol: 'pair',
    category: 'quantity',
  },
  {
    code: 'box',
    name: 'Box',
    symbol: 'box',
    category: 'quantity',
  },
  {
    code: 'pack',
    name: 'Pack',
    symbol: 'pack',
    category: 'quantity',
  },
  {
    code: 'dozen',
    name: 'Dozen',
    symbol: 'doz',
    category: 'quantity',
  },

  // Length units
  {
    code: 'mm',
    name: 'Millimeter',
    symbol: 'mm',
    category: 'length',
    baseUnit: 'm',
    conversion: 0.001,
  },
  {
    code: 'cm',
    name: 'Centimeter',
    symbol: 'cm',
    category: 'length',
    baseUnit: 'm',
    conversion: 0.01,
  },
  {
    code: 'm',
    name: 'Meter',
    symbol: 'm',
    category: 'length',
    baseUnit: 'm',
    conversion: 1.0,
  },
  {
    code: 'inch',
    name: 'Inch',
    symbol: 'in',
    category: 'length',
    baseUnit: 'm',
    conversion: 0.0254,
  },
  {
    code: 'ft',
    name: 'Foot',
    symbol: 'ft',
    category: 'length',
    baseUnit: 'm',
    conversion: 0.3048,
  },

  // Clothing sizes (label-based)
  {
    code: 'xs',
    name: 'Extra Small',
    symbol: 'XS',
    category: 'clothing',
  },
  {
    code: 's',
    name: 'Small',
    symbol: 'S',
    category: 'clothing',
  },
  {
    code: 'm',
    name: 'Medium',
    symbol: 'M',
    category: 'clothing',
  },
  {
    code: 'l',
    name: 'Large',
    symbol: 'L',
    category: 'clothing',
  },
  {
    code: 'xl',
    name: 'Extra Large',
    symbol: 'XL',
    category: 'clothing',
  },
  {
    code: 'xxl',
    name: 'Double Extra Large',
    symbol: 'XXL',
    category: 'clothing',
  },
  {
    code: '3xl',
    name: 'Triple Extra Large',
    symbol: '3XL',
    category: 'clothing',
  },
];

// Common sizes by category for quick-select
export const COMMON_SIZES: Record<string, { value: number; unit: string }[]> = {
  volume: [
    { value: 50, unit: 'ml' },
    { value: 100, unit: 'ml' },
    { value: 250, unit: 'ml' },
    { value: 500, unit: 'ml' },
    { value: 750, unit: 'ml' },
    { value: 1000, unit: 'ml' },
    { value: 1, unit: 'l' },
    { value: 1.5, unit: 'l' },
    { value: 2, unit: 'l' },
    { value: 5, unit: 'l' },
  ],
  weight: [
    { value: 10, unit: 'g' },
    { value: 25, unit: 'g' },
    { value: 50, unit: 'g' },
    { value: 75, unit: 'g' },
    { value: 100, unit: 'g' },
    { value: 250, unit: 'g' },
    { value: 500, unit: 'g' },
    { value: 1, unit: 'kg' },
    { value: 2, unit: 'kg' },
    { value: 5, unit: 'kg' },
  ],
  quantity: [
    { value: 1, unit: 'pc' },
    { value: 2, unit: 'pc' },
    { value: 3, unit: 'pc' },
    { value: 5, unit: 'pc' },
    { value: 10, unit: 'pc' },
    { value: 1, unit: 'pair' },
    { value: 1, unit: 'set' },
    { value: 1, unit: 'dozen' },
  ],
  length: [
    { value: 10, unit: 'cm' },
    { value: 20, unit: 'cm' },
    { value: 30, unit: 'cm' },
    { value: 50, unit: 'cm' },
    { value: 100, unit: 'cm' },
    { value: 1, unit: 'm' },
    { value: 1.5, unit: 'm' },
    { value: 2, unit: 'm' },
  ],
  clothing: [], // Clothing sizes use label-based selection
};

// Get size units by category
export function getSizeUnitsByCategory(category: SizeUnit['category']): SizeUnit[] {
  return SIZE_UNITS.filter((unit) => unit.category === category);
}

// Get size unit by code
export function getSizeUnitByCode(code: string): SizeUnit | undefined {
  return SIZE_UNITS.find((unit) => unit.code === code);
}

// Get common sizes for a category
export function getCommonSizes(category: SizeUnit['category']): { value: number; unit: string }[] {
  return COMMON_SIZES[category] || [];
}

// Format size for display
export function formatSize(
  sizeType: 'unit' | 'label' | null | undefined,
  sizeValue: number | null | undefined,
  sizeUnit: string | null | undefined,
  sizeLabel: string | null | undefined
): string {
  if (!sizeType) return '';

  if (sizeType === 'label') {
    return sizeLabel || '';
  }

  if (sizeType === 'unit' && sizeValue !== null && sizeValue !== undefined) {
    const unit = getSizeUnitByCode(sizeUnit || '');
    const symbol = unit?.symbol || sizeUnit || '';
    return `${sizeValue} ${symbol}`;
  }

  return '';
}

// Get recommended size units for a product category
export function getRecommendedSizeUnits(productCategory: string): SizeUnit[] {
  const categoryLower = productCategory.toLowerCase();

  // Beverages, liquids, oils
  if (categoryLower.includes('beverage') || categoryLower.includes('drink') ||
      categoryLower.includes('juice') || categoryLower.includes('water') ||
      categoryLower.includes('oil') || categoryLower.includes('liquid')) {
    return getSizeUnitsByCategory('volume');
  }

  // Food, groceries, spices
  if (categoryLower.includes('food') || categoryLower.includes('grocery') ||
      categoryLower.includes('spice') || categoryLower.includes('grain') ||
      categoryLower.includes('rice') || categoryLower.includes('flour')) {
    return [...getSizeUnitsByCategory('weight'), ...getSizeUnitsByCategory('quantity')];
  }

  // Clothing, fashion
  if (categoryLower.includes('cloth') || categoryLower.includes('fashion') ||
      categoryLower.includes('dress') || categoryLower.includes('shirt') ||
      categoryLower.includes('pant') || categoryLower.includes('wear')) {
    return getSizeUnitsByCategory('clothing');
  }

  // Electronics, appliances
  if (categoryLower.includes('electronic') || categoryLower.includes('appliance')) {
    return getSizeUnitsByCategory('quantity');
  }

  // Default: return all units
  return SIZE_UNITS;
}
