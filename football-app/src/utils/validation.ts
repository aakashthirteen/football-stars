export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationSchema {
  [field: string]: ValidationRule | ValidationRule[];
}

export interface ValidationErrors {
  [field: string]: string | null;
}

export const validateField = (value: any, rules: ValidationRule | ValidationRule[]): string | null => {
  const rulesArray = Array.isArray(rules) ? rules : [rules];
  
  for (const rule of rulesArray) {
    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      return rule.message || 'This field is required';
    }
    
    // Skip other validations if value is empty and not required
    if (!value || value.toString().trim() === '') {
      continue;
    }
    
    const stringValue = value.toString();
    
    // Min length validation
    if (rule.minLength && stringValue.length < rule.minLength) {
      return rule.message || `Minimum length is ${rule.minLength} characters`;
    }
    
    // Max length validation
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return rule.message || `Maximum length is ${rule.maxLength} characters`;
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return rule.message || 'Invalid format';
    }
    
    // Custom validation
    if (rule.custom) {
      const error = rule.custom(value);
      if (error) return error;
    }
  }
  
  return null;
};

export const validateForm = (values: any, schema: ValidationSchema): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  Object.keys(schema).forEach(field => {
    errors[field] = validateField(values[field], schema[field]);
  });
  
  return errors;
};

export const hasErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some(error => error !== null);
};

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s+()-]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
};

// Common validation rules
export const commonRules = {
  required: { required: true },
  email: { 
    required: true, 
    pattern: patterns.email, 
    message: 'Please enter a valid email address' 
  },
  password: { 
    required: true, 
    minLength: 6, 
    message: 'Password must be at least 6 characters' 
  },
  teamName: { 
    required: true, 
    minLength: 3, 
    maxLength: 50,
    message: 'Team name must be between 3 and 50 characters' 
  },
  playerName: { 
    required: true, 
    minLength: 2, 
    maxLength: 50,
    message: 'Name must be between 2 and 50 characters' 
  },
  description: { 
    maxLength: 200,
    message: 'Description cannot exceed 200 characters' 
  },
  venue: { 
    maxLength: 100,
    message: 'Venue cannot exceed 100 characters' 
  },
  numeric: {
    pattern: patterns.numeric,
    message: 'Please enter a valid number'
  },
  positiveNumber: {
    pattern: patterns.numeric,
    custom: (value: string) => {
      const num = parseInt(value, 10);
      if (num <= 0) return 'Must be greater than 0';
      return null;
    }
  }
};

// Validation hook
import { useState, useCallback } from 'react';

export const useValidation = (schema: ValidationSchema) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [field: string]: boolean }>({});
  
  const validateFieldValue = useCallback((field: string, value: any) => {
    if (schema[field]) {
      const error = validateField(value, schema[field]);
      setErrors(prev => ({ ...prev, [field]: error }));
      return error;
    }
    return null;
  }, [schema]);
  
  const validateAll = useCallback((values: any) => {
    const newErrors = validateForm(values, schema);
    setErrors(newErrors);
    return !hasErrors(newErrors);
  }, [schema]);
  
  const touch = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);
  
  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);
  
  return {
    errors,
    touched,
    validateField: validateFieldValue,
    validateAll,
    touch,
    reset,
    hasErrors: hasErrors(errors)
  };
};
