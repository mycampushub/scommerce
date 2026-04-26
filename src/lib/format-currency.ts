/**
 * Format currency as Bangladeshi Taka (BDT)
 * @param value - The numeric value to format
 * @returns Formatted string with ৳ symbol and comma separators
 */
export function formatCurrency(value: number): string {
  return `৳${value.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}
