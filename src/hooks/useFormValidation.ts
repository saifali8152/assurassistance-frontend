import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string, currentFields?: FormData) => string | null;
  message?: string;
}

export interface FormField {
  value: string;
  error: string | null;
  touched: boolean;
  rules: ValidationRule;
}

export interface FormData {
  [key: string]: FormField;
}

export const useFormValidation = (initialFields: Record<string, ValidationRule>) => {
  const [fields, setFields] = useState<FormData>(() => {
    const initialFormData: FormData = {};
    Object.keys(initialFields).forEach(key => {
      initialFormData[key] = {
        value: '',
        error: null,
        touched: false,
        rules: initialFields[key]
      };
    });
    return initialFormData;
  });

  const validateField = useCallback((name: string, value: string, currentFields?: FormData): string | null => {
    const field = currentFields ? currentFields[name] : fields[name];
    if (!field) return null;

    const { rules } = field;

    // Required validation
    if (rules.required && (!value || value.trim() === '')) {
      return rules.message || `${name} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim() === '') {
      return null;
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      return rules.message || `${name} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      return rules.message || `${name} must be no more than ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || `${name} format is invalid`;
    }

    // Custom validation - pass current fields state for cross-field validation
    if (rules.custom) {
      // Create a mock fields object for custom validation functions
      const mockFields = currentFields || fields;
      return rules.custom(value, mockFields);
    }

    return null;
  }, [fields]);

  const updateField = useCallback((name: string, value: string) => {
    setFields(prev => {
      const field = prev[name];
      if (!field) return prev;

      // Create updated fields for validation
      const updatedFields = {
        ...prev,
        [name]: {
          ...field,
          value,
          error: null,
          touched: true
        }
      };

      const error = validateField(name, value, updatedFields);
      
      const newFields = {
        ...updatedFields,
        [name]: {
          ...updatedFields[name],
          error
        }
      };

      // Re-validate dependent fields when newPassword changes
      if (name === 'newPassword' && prev.confirmPassword) {
        const confirmPasswordError = validateField('confirmPassword', prev.confirmPassword.value, newFields);
        newFields.confirmPassword = {
          ...prev.confirmPassword,
          error: confirmPasswordError
        };
      }

      return newFields;
    });
  }, [validateField]);

  const validateForm = useCallback((): boolean => {
    let isValid = true;
    const newFields = { ...fields };

    Object.keys(fields).forEach(name => {
      const field = fields[name];
      const error = validateField(name, field.value);
      
      if (error) {
        isValid = false;
        newFields[name] = {
          ...field,
          error,
          touched: true
        };
      }
    });

    setFields(newFields);
    return isValid;
  }, [fields, validateField]);

  const resetForm = useCallback(() => {
    setFields(prev => {
      const newFields = { ...prev };
      Object.keys(newFields).forEach(key => {
        newFields[key] = {
          ...newFields[key],
          value: '',
          error: null,
          touched: false
        };
      });
      return newFields;
    });
  }, []);

  const setFieldError = useCallback((name: string, error: string | null) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
        touched: true
      }
    }));
  }, []);

  const getFieldValue = useCallback((name: string): string => {
    return fields[name]?.value || '';
  }, [fields]);

  const getFieldError = useCallback((name: string): string | null => {
    return fields[name]?.error || null;
  }, [fields]);

  const isFieldTouched = useCallback((name: string): boolean => {
    return fields[name]?.touched || false;
  }, [fields]);

  const isFormValid = useCallback((): boolean => {
    return Object.values(fields).every(field => !field.error);
  }, [fields]);

  const getFormData = useCallback((): Record<string, string> => {
    const formData: Record<string, string> = {};
    Object.keys(fields).forEach(key => {
      formData[key] = fields[key].value;
    });
    return formData;
  }, [fields]);

  return {
    fields,
    updateField,
    validateForm,
    resetForm,
    setFieldError,
    getFieldValue,
    getFieldError,
    isFieldTouched,
    isFormValid,
    getFormData
  };
};

// Common validation rules
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
  },
  phone: {
    required: true,
    pattern: /^[\+]?[0-9]{7,15}$/,
    message: 'Please enter a valid phone number'
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Name must contain only letters and spaces'
  },
  passportId: {
    required: true,
    minLength: 6,
    maxLength: 9,
    pattern: /^[A-Z0-9]+$/,
    message: 'Passport ID must be 6-9 characters, letters and numbers only'
  }
};
