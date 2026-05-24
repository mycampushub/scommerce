/**
 * Null Safety Utilities
 * Helper functions for safe null/undefined handling
 */

/**
 * Safely get a nested property value
 */
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  return obj?.[key] ?? defaultValue
}

/**
 * Safely get a deeply nested property value
 */
export function safeGetPath<T>(
  obj: unknown,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue
    }
    result = (result as Record<string, unknown>)[key]
  }

  return result as T ?? defaultValue
}

/**
 * Safe array access
 */
export function safeGetItem<T>(
  arr: T[] | null | undefined,
  index: number,
  defaultValue?: T
): T | undefined {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return defaultValue
  }
  return arr[index] ?? defaultValue
}

/**
 * Safe number parsing with fallback
 */
export function safeParseNumber(
  value: unknown,
  defaultValue: number = 0
): number {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? defaultValue : value
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return Number.isNaN(parsed) ? defaultValue : parsed
  }
  return defaultValue
}

/**
 * Safe integer parsing with fallback
 */
export function safeParseInt(
  value: unknown,
  defaultValue: number = 0
): number {
  const num = safeParseNumber(value, defaultValue)
  return Math.floor(num)
}

/**
 * Safe JSON parsing with fallback
 */
export function safeParseJSON<T = unknown>(
  value: string | null | undefined,
  defaultValue: T
): T {
  if (!value) {
    return defaultValue
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return defaultValue
  }
}

/**
 * Safe array mapping
 */
export function safeMap<T, U>(
  arr: T[] | null | undefined,
  mapper: (item: T, index: number) => U,
  defaultValue: U[] = []
): U[] {
  if (!Array.isArray(arr)) {
    return defaultValue
  }
  return arr.map(mapper)
}

/**
 * Safe array filtering
 */
export function safeFilter<T>(
  arr: T[] | null | undefined,
  predicate: (item: T, index: number) => boolean,
  defaultValue: T[] = []
): T[] {
  if (!Array.isArray(arr)) {
    return defaultValue
  }
  return arr.filter(predicate)
}

/**
 * Safe string formatting
 */
export function safeString(value: unknown, fallback: string = ''): string {
  if (value === null || value === undefined) {
    return fallback
  }
  return String(value) ?? fallback
}

/**
 * Safe boolean conversion
 */
export function safeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1'
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  return false
}

/**
 * Safe date parsing
 */
export function safeDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

/**
 * Safe date formatting
 */
export function safeDateFormat(
  value: unknown,
  format: 'date' | 'time' | 'datetime' = 'datetime',
  locale: string = 'en-US'
): string {
  const date = safeDate(value)
  if (!date) return ''

  const formatOptions: Record<'date' | 'time' | 'datetime', Intl.DateTimeFormatOptions> = {
    date: { dateStyle: 'medium' },
    time: { timeStyle: 'short' },
    datetime: { dateStyle: 'medium', timeStyle: 'short' }
  }

  try {
    return new Intl.DateTimeFormat(locale, formatOptions[format]).format(date)
  } catch {
    return ''
  }
}
