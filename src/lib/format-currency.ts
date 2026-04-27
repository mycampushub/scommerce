import { SiteSettings, calculateTax, calculateShipping, calculateTotal, formatCurrency as formatCurrencyUtil } from '@/db/settings.repository';

/**
 * Format currency with settings
 * @param value - The numeric value to format
 * @param settings - Optional site settings for dynamic currency
 * @returns Formatted string with currency symbol and comma separators
 */
export function formatCurrency(value: number, settings?: SiteSettings): string {
  // If settings provided, use dynamic currency symbol and formatting
  if (settings) {
    return formatCurrencyUtil(value, settings);
  }

  // Default: Bangladeshi Taka (BDT) formatting
  return `৳${value.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

/**
 * Calculate tax with settings
 */
export function getTax(amount: number, settings?: SiteSettings): number {
  return calculateTax(amount, settings);
}

/**
 * Calculate shipping with settings
 */
export function getShipping(subtotal: number, settings?: SiteSettings): number {
  return calculateShipping(subtotal, settings);
}

/**
 * Calculate total with tax and shipping
 */
export function getOrderTotal(subtotal: number, settings?: SiteSettings) {
  return calculateTotal(subtotal, settings);
}

// Re-export for convenience
export {
  calculateTax,
  calculateShipping,
  calculateTotal,
};
