import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Validation rule types
export type ValidationRule = {
  required?: boolean | string;
  min?: number | string;
  max?: number | string;
  minLength?: number | string;
  maxLength?: number | string;
  pattern?: RegExp | string;
  email?: boolean | string;
  phone?: boolean | string;
  url?: boolean | string;
  number?: boolean | string;
  integer?: boolean | string;
  positive?: boolean | string;
  custom?: (value: any, allValues: Record<string, any>) => string | null;
};

export type FieldState = {
  value: any;
  error: string | null;
  touched: boolean;
  valid: boolean;
};

export type FormState = {
  [fieldName: string]: FieldState;
};

// Built-in validation functions
const validators = {
  required: (value: any, message?: string) => {
    if (value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      return message || 'This field is required';
    }
    return null;
  },

  min: (value: any, min: number, message?: string) => {
    const num = Number(value);
    if (isNaN(num) || num < min) {
      return message || `Value must be at least ${min}`;
    }
    return null;
  },

  max: (value: any, max: number, message?: string) => {
    const num = Number(value);
    if (isNaN(num) || num > max) {
      return message || `Value must not exceed ${max}`;
    }
    return null;
  },

  minLength: (value: any, minLength: number, message?: string) => {
    const str = String(value || '');
    if (str.length < minLength) {
      return message || `Must be at least ${minLength} characters`;
    }
    return null;
  },

  maxLength: (value: any, maxLength: number, message?: string) => {
    const str = String(value || '');
    if (str.length > maxLength) {
      return message || `Must not exceed ${maxLength} characters`;
    }
    return null;
  },

  pattern: (value: any, pattern: RegExp, message?: string) => {
    const str = String(value || '');
    if (str && !pattern.test(str)) {
      return message || 'Invalid format';
    }
    return null;
  },

  email: (value: any, message?: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const str = String(value || '');
    if (str && !emailRegex.test(str)) {
      return message || 'Please enter a valid email address';
    }
    return null;
  },

  phone: (value: any, message?: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const str = String(value || '').replace(/[\s\-\(\)]/g, '');
    if (str && !phoneRegex.test(str)) {
      return message || 'Please enter a valid phone number';
    }
    return null;
  },

  url: (value: any, message?: string) => {
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    const str = String(value || '');
    if (str && !urlRegex.test(str)) {
      return message || 'Please enter a valid URL';
    }
    return null;
  },

  number: (value: any, message?: string) => {
    if (value !== null && value !== undefined && value !== '' && isNaN(Number(value))) {
      return message || 'Must be a valid number';
    }
    return null;
  },

  integer: (value: any, message?: string) => {
    const num = Number(value);
    if (value !== null && value !== undefined && value !== '' && 
        (isNaN(num) || !Number.isInteger(num))) {
      return message || 'Must be a whole number';
    }
    return null;
  },

  positive: (value: any, message?: string) => {
    const num = Number(value);
    if (!isNaN(num) && num <= 0) {
      return message || 'Must be a positive number';
    }
    return null;
  },
};

// Validation context
interface FormValidatorContextType {
  formState: FormState;
  setFieldValue: (fieldName: string, value: any) => void;
  setFieldTouched: (fieldName: string, touched?: boolean) => void;
  setFieldError: (fieldName: string, error: string | null) => void;
  validateField: (fieldName: string, rules?: ValidationRule) => string | null;
  validateForm: () => boolean;
  resetForm: () => void;
  resetField: (fieldName: string) => void;
  isFormValid: boolean;
  isFormTouched: boolean;
  getFieldProps: (fieldName: string, rules?: ValidationRule) => {
    value: any;
    error: string | null;
    onChangeText: (value: any) => void;
    onBlur: () => void;
  };
}

const FormValidatorContext = createContext<FormValidatorContextType | null>(null);

// Form validator provider
interface FormValidatorProviderProps {
  children: ReactNode;
  initialValues?: Record<string, any>;
  validationRules?: Record<string, ValidationRule>;
  onSubmit?: (values: Record<string, any>) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export const FormValidatorProvider: React.FC<FormValidatorProviderProps> = ({
  children,
  initialValues = {},
  validationRules = {},
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
}) => {
  const [formState, setFormState] = useState<FormState>(() => {
    const initialState: FormState = {};
    Object.keys(initialValues).forEach(fieldName => {
      initialState[fieldName] = {
        value: initialValues[fieldName],
        error: null,
        touched: false,
        valid: true,
      };
    });
    return initialState;
  });

  const validateFieldValue = useCallback((
    fieldName: string, 
    value: any, 
    rules?: ValidationRule
  ): string | null => {
    const fieldRules = rules || validationRules[fieldName];
    if (!fieldRules) return null;

    const allValues = Object.keys(formState).reduce((acc, key) => {
      acc[key] = formState[key].value;
      return acc;
    }, {} as Record<string, any>);
    allValues[fieldName] = value; // Include current value

    // Check each validation rule
    for (const [ruleName, ruleValue] of Object.entries(fieldRules)) {
      if (ruleValue === false || ruleValue === null || ruleValue === undefined) continue;

      let error: string | null = null;

      switch (ruleName) {
        case 'required':
          error = validators.required(value, typeof ruleValue === 'string' ? ruleValue : undefined);
          break;
        case 'min':
          if (typeof ruleValue === 'number') {
            error = validators.min(value, ruleValue);
          } else if (typeof ruleValue === 'string') {
            error = validators.min(value, 0, ruleValue);
          }
          break;
        case 'max':
          if (typeof ruleValue === 'number') {
            error = validators.max(value, ruleValue);
          } else if (typeof ruleValue === 'string') {
            error = validators.max(value, Infinity, ruleValue);
          }
          break;
        case 'minLength':
          if (typeof ruleValue === 'number') {
            error = validators.minLength(value, ruleValue);
          } else if (typeof ruleValue === 'string') {
            error = validators.minLength(value, 0, ruleValue);
          }
          break;
        case 'maxLength':
          if (typeof ruleValue === 'number') {
            error = validators.maxLength(value, ruleValue);
          } else if (typeof ruleValue === 'string') {
            error = validators.maxLength(value, Infinity, ruleValue);
          }
          break;
        case 'pattern':
          if (ruleValue instanceof RegExp) {
            error = validators.pattern(value, ruleValue);
          } else if (typeof ruleValue === 'string') {
            error = validators.pattern(value, /.*/, ruleValue);
          }
          break;
        case 'email':
          error = validators.email(value, typeof ruleValue === 'string' ? ruleValue : undefined);
          break;
        case 'phone':
          error = validators.phone(value, typeof ruleValue === 'string' ? ruleValue : undefined);
          break;
        case 'url':
          error = validators.url(value, typeof ruleValue === 'string' ? ruleValue : undefined);
          break;
        case 'number':
          error = validators.number(value, typeof ruleValue === 'string' ? ruleValue : undefined);
          break;
        case 'integer':
          error = validators.integer(value, typeof ruleValue === 'string' ? ruleValue : undefined);
          break;
        case 'positive':
          error = validators.positive(value, typeof ruleValue === 'string' ? ruleValue : undefined);
          break;
        case 'custom':
          if (typeof ruleValue === 'function') {
            error = ruleValue(value, allValues);
          }
          break;
      }

      if (error) return error;
    }

    return null;
  }, [formState, validationRules]);

  const setFieldValue = useCallback((fieldName: string, value: any) => {
    setFormState(prev => {
      const error = validateOnChange ? validateFieldValue(fieldName, value) : prev[fieldName]?.error || null;
      return {
        ...prev,
        [fieldName]: {
          value,
          error,
          touched: prev[fieldName]?.touched || false,
          valid: !error,
        },
      };
    });
  }, [validateOnChange, validateFieldValue]);

  const setFieldTouched = useCallback((fieldName: string, touched = true) => {
    setFormState(prev => {
      const currentField = prev[fieldName] || { value: '', error: null, touched: false, valid: true };
      const error = validateOnBlur && touched ? 
        validateFieldValue(fieldName, currentField.value) : currentField.error;
      
      return {
        ...prev,
        [fieldName]: {
          ...currentField,
          touched,
          error,
          valid: !error,
        },
      };
    });
  }, [validateOnBlur, validateFieldValue]);

  const setFieldError = useCallback((fieldName: string, error: string | null) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error,
        valid: !error,
      },
    }));
  }, []);

  const validateField = useCallback((fieldName: string, rules?: ValidationRule) => {
    const currentValue = formState[fieldName]?.value;
    const error = validateFieldValue(fieldName, currentValue, rules);
    setFieldError(fieldName, error);
    return error;
  }, [formState, validateFieldValue, setFieldError]);

  const validateForm = useCallback(() => {
    let isValid = true;
    const newFormState = { ...formState };

    Object.keys(validationRules).forEach(fieldName => {
      const currentValue = formState[fieldName]?.value;
      const error = validateFieldValue(fieldName, currentValue);
      
      newFormState[fieldName] = {
        ...newFormState[fieldName],
        error,
        valid: !error,
        touched: true,
      };

      if (error) isValid = false;
    });

    setFormState(newFormState);
    return isValid;
  }, [formState, validationRules, validateFieldValue]);

  const resetForm = useCallback(() => {
    const resetState: FormState = {};
    Object.keys(initialValues).forEach(fieldName => {
      resetState[fieldName] = {
        value: initialValues[fieldName],
        error: null,
        touched: false,
        valid: true,
      };
    });
    setFormState(resetState);
  }, [initialValues]);

  const resetField = useCallback((fieldName: string) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        value: initialValues[fieldName] || '',
        error: null,
        touched: false,
        valid: true,
      },
    }));
  }, [initialValues]);

  const isFormValid = Object.values(formState).every(field => field.valid);
  const isFormTouched = Object.values(formState).some(field => field.touched);

  const getFieldProps = useCallback((fieldName: string, rules?: ValidationRule) => {
    const field = formState[fieldName] || { value: '', error: null, touched: false, valid: true };
    
    return {
      value: field.value,
      error: field.touched ? field.error : null,
      onChangeText: (value: any) => setFieldValue(fieldName, value),
      onBlur: () => setFieldTouched(fieldName, true),
    };
  }, [formState, setFieldValue, setFieldTouched]);

  return (
    <FormValidatorContext.Provider
      value={{
        formState,
        setFieldValue,
        setFieldTouched,
        setFieldError,
        validateField,
        validateForm,
        resetForm,
        resetField,
        isFormValid,
        isFormTouched,
        getFieldProps,
      }}
    >
      {children}
    </FormValidatorContext.Provider>
  );
};

// Hook to use form validation
export const useFormValidator = () => {
  const context = useContext(FormValidatorContext);
  if (!context) {
    throw new Error('useFormValidator must be used within a FormValidatorProvider');
  }
  return context;
};

// Individual field validation hook
export const useFieldValidator = (
  fieldName: string, 
  rules?: ValidationRule,
  initialValue?: any
) => {
  const {
    formState,
    setFieldValue,
    setFieldTouched,
    validateField,
    getFieldProps,
  } = useFormValidator();

  // Initialize field if it doesn't exist
  React.useEffect(() => {
    if (!formState[fieldName] && initialValue !== undefined) {
      setFieldValue(fieldName, initialValue);
    }
  }, [fieldName, initialValue, formState, setFieldValue]);

  return {
    ...getFieldProps(fieldName, rules),
    validate: () => validateField(fieldName, rules),
    reset: () => setFieldValue(fieldName, initialValue || ''),
  };
};

export default FormValidatorProvider;