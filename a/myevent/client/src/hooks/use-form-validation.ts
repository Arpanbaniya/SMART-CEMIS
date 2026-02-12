import { useState, useCallback } from 'react'
import { z } from 'zod'

interface UseFormValidationProps<T> {
  schema: z.ZodSchema<T>
  initialValues: T
  onSubmit?: (values: T) => void | Promise<void>
}

interface ValidationErrors {
  [key: string]: string
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialValues,
  onSubmit
}: UseFormValidationProps<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = useCallback((field: string, value: any) => {
    try {
      const fieldSchema = (schema as any).shape?.[field]
      if (fieldSchema) {
        fieldSchema.parse(value)
      }
      return null
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues[0]?.message || 'Invalid value'
      }
      return 'Validation error'
    }
  }, [schema])

  const validateForm = useCallback((data: T) => {
    try {
      schema.parse(data)
      return {}
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: ValidationErrors = {}
        error.issues.forEach((err: any) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        return fieldErrors
      }
      return { _form: 'Validation error' }
    }
  }, [schema])

  const handleChange = useCallback((field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Validate field if it has been touched
    if (touched[field]) {
      const fieldError = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: fieldError || '' }))
    }
  }, [validateField]) // Remove errors and touched from dependencies

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Validate field on blur
    const fieldError = validateField(field, values[field])
    setErrors(prev => ({ ...prev, [field]: fieldError || '' }))
  }, [values, validateField])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    // Mark all fields as touched
    const allFields = Object.keys(values)
    setTouched(prev => {
      const newTouched = { ...prev }
      allFields.forEach(field => {
        newTouched[field] = true
      })
      return newTouched
    })
    
    // Validate entire form
    const formErrors = validateForm(values)
    setErrors(formErrors)
    
    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true)
      try {
        await onSubmit?.(values)
      } catch (error) {
        console.error('Submit error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [values, validateForm, onSubmit])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }))
  }, [])

  const clearError = useCallback((field: string) => {
    setErrors(prev => ({ ...prev, [field]: '' }))
  }, [])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setError,
    clearError,
    isValid: Object.keys(errors).length === 0
  }
}
