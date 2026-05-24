/**
 * Common Validators
 * Reusable validation functions
 */

import type { ValidationRule, ValidationResult } from './types'

/**
 * Validate a single field against rules
 */
export function validateField<T = unknown>(
  value: T,
  rules: ValidationRule<T>
): string | null {
  // Required validation
  if (rules.required) {
    if (value === null || value === undefined || value === '') {
      return rules.message || 'This field is required'
    }
  }

  // Skip further validations if field is empty and not required
  if (value === null || value === undefined || value === '') {
    return null
  }

  // String validations
  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      return rules.message || `Must be at least ${rules.minLength} characters`
    }

    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      return rules.message || `Must be no more than ${rules.maxLength} characters`
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || 'Invalid format'
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return rules.message || `Must be at least ${rules.min}`
    }

    if (rules.max !== undefined && value > rules.max) {
      return rules.message || `Must be no more than ${rules.max}`
    }
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value)
  }

  return null
}

/**
 * Validate entire form against schema
 */
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  schema: Record<keyof T, ValidationRule<T[keyof T]>>
): ValidationResult {
  const errors: Record<string, string> = {}
  let isValid = true

  for (const [field, rules] of Object.entries(schema)) {
    const error = validateField(values[field as keyof T], rules)
    if (error) {
      errors[field] = error
      isValid = false
    }
  }

  return { isValid, errors }
}

/**
 * Common validation rules
 */
export const Validators = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message: message || 'This field is required'
  }),

  email: (message?: string): ValidationRule => ({
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: message || 'Please enter a valid email address'
  }),

  phone: (message?: string): ValidationRule => ({
    required: true,
    pattern: /^\+?[\d\s-]{10,}$/,
    message: message || 'Please enter a valid phone number'
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    required: false,
    minLength: min,
    message: message || `Must be at least ${min} characters`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    required: false,
    maxLength: max,
    message: message || `Must be no more than ${max} characters`
  }),

  minNumber: (min: number, message?: string): ValidationRule => ({
    required: false,
    min,
    message: message || `Must be at least ${min}`
  }),

  maxNumber: (max: number, message?: string): ValidationRule => ({
    required: false,
    max,
    message: message || `Must be no more than ${max}`
  }),

  positiveNumber: (message?: string): ValidationRule => ({
    required: false,
    min: 0,
    custom: (value: unknown) => {
      if (typeof value === 'number' && value <= 0) {
        return message || 'Must be a positive number'
      }
      return null
    }
  }),

  url: (message?: string): ValidationRule => ({
    required: false,
    pattern: /^https?:\/\/.+/,
    message: message || 'Please enter a valid URL'
  }),

  password: (message?: string): ValidationRule => ({
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: message || 'Password must be at least 8 characters with uppercase, lowercase, and number'
  })
}
