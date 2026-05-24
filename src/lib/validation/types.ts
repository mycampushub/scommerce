/**
 * Form Validation Types
 * Type definitions for form validation system
 */

export interface ValidationRule<T = unknown> {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: T) => string | null
  message?: string
}

export type ValidationSchema<T extends Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T[K]>
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface FormFieldError {
  message: string
  touched: boolean
}

export type FormErrors<T> = Partial<Record<keyof T, FormFieldError>>
