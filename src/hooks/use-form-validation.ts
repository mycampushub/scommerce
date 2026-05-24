/**
 * Custom Hook: useFormValidation
 * Reusable form validation hook
 */

import { useState, useCallback } from 'react'
import type { ValidationSchema, FormErrors } from '../lib/validation/types'
import { validateField, Validators } from '@/lib/validation/validators'

export interface UseFormValidationOptions<T extends Record<string, unknown>> {
  initialValues: T
  validationSchema: ValidationSchema<T>
  onSubmit: (values: T) => Promise<void> | void
}

export interface UseFormValidationReturn<T extends Record<string, unknown>> {
  values: T
  errors: FormErrors<T>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void
  handleBlur: <K extends keyof T>(field: K) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  resetForm: () => void
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void
  setFieldError: <K extends keyof T>(field: K, error: string | null) => void
}

export function useFormValidation<T extends Record<string, unknown>>(
  options: UseFormValidationOptions<T>
): UseFormValidationReturn<T> {
  const { initialValues, validationSchema, onSubmit } = options

  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors<T>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate overall form validity
  const isValid = Object.keys(errors).length === 0

  const handleChange = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }))

    // Validate field if it has been touched
    if (touched[field]) {
      const rules = validationSchema[field]
      if (rules) {
        const error = validateField(value, rules)
        setErrors(prev => ({
          ...prev,
          [field]: error ? { message: error, touched: true } : undefined
        }))
      }
    }
  }, [touched, validationSchema])

  const handleBlur = useCallback(<K extends keyof T>(field: K) => {
    setTouched(prev => ({ ...prev, [field]: true }))

    const rules = validationSchema[field]
    if (rules) {
      const error = validateField(values[field], rules)
      setErrors(prev => ({
        ...prev,
        [field]: error ? { message: error, touched: true } : undefined
      }))
    }
  }, [validationSchema, values])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    const allTouched = Object.keys(validationSchema).reduce((acc, key) => {
      acc[key as keyof T] = true
      return acc
    }, {} as Partial<Record<keyof T, boolean>>)

    setTouched(allTouched)

    // Validate all fields
    const newErrors: FormErrors<T> = {}
    let hasError = false

    for (const [field, rules] of Object.entries(validationSchema)) {
      const error = validateField(values[field as keyof T], rules)
      if (error) {
        newErrors[field as keyof T] = { message: error, touched: true }
        hasError = true
      }
    }

    setErrors(newErrors)

    if (hasError) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(values)
    } finally {
      setIsSubmitting(false)
    }
  }, [validationSchema, values, onSubmit])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    handleChange(field, value)
  }, [handleChange])

  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string | null) => {
    setErrors(prev => ({
      ...prev,
      [field]: error ? { message: error, touched: true } : undefined
    }))
  }, [])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError
  }
}

export { Validators }
