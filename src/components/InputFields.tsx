import React, { useState, useEffect } from "react";

interface InputFieldProps {
  type: string;
  name?: string;
  placeholder: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  className?: string;
  label?: string;
  id?: string;
  readOnly?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>; // <-- add
  validationType?: 'fullName' | 'email' | 'phone' | 'passportId';
  showValidation?: boolean;
  externalError?: string | null; // Add external error prop
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  type,
  name,
  placeholder,
  icon,
  value,
  onChange,
  required = false,
  rightIcon,
  onRightIconClick,
  className = "",
  label,
  id,
  validationType,
  showValidation = true,
  externalError,
  ...props
}) => {
  // Generate a unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  // State for validation
  const [validationError, setValidationError] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);

  // Enhanced security validation functions
  const validateInput = (inputValue: string, validationType?: string): string => {
    if (!validationType) return inputValue;

    // Basic XSS protection - remove potentially dangerous characters
    let sanitized = inputValue.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    switch (validationType) {
      case 'fullName':
        let cleanedName = sanitized.replace(/[^a-zA-Z\s]/g, '');
        cleanedName = cleanedName.replace(/^\s+|\s+$/g, '');
        cleanedName = cleanedName.replace(/\s{2,}/g, ' '); 
        if (cleanedName.length > 50) {
          cleanedName = cleanedName.substring(0, 50);
        }
        return cleanedName;

      case 'email':
        let cleanedEmail = sanitized.replace(/\s/g, '').toLowerCase();
        if (cleanedEmail.length > 100) {
          cleanedEmail = cleanedEmail.substring(0, 100);
        }
        return cleanedEmail;

      case 'phone':
        let cleanedPhone = sanitized.replace(/[^0-9+]/g, '');
        if (cleanedPhone.includes('+')) {
          const plusCount = (cleanedPhone.match(/\+/g) || []).length;
          if (plusCount > 1 || cleanedPhone.indexOf('+') !== 0) {
            cleanedPhone = cleanedPhone.replace(/\+/g, '');
            if (inputValue.startsWith('+')) {
              cleanedPhone = '+' + cleanedPhone;
            }
          }
        }
        const digitsOnly = cleanedPhone.replace(/\+/g, '');
        if (digitsOnly.length > 15) {
          const prefix = cleanedPhone.startsWith('+') ? '+' : '';
          cleanedPhone = prefix + digitsOnly.substring(0, 15);
        }
        return cleanedPhone;

      case 'passportId':
        let cleanedPassport = sanitized.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleanedPassport.length > 9) {
          cleanedPassport = cleanedPassport.substring(0, 9);
        }
        return cleanedPassport;

      default:
        return sanitized;
    }
  };

  // Additional validation for minimum lengths and format checks
  const isValidInput = (inputValue: string, validationType?: string): boolean => {
    if (!validationType) return true;

    switch (validationType) {
      case 'fullName':
        return inputValue.length >= 2 && /^[a-zA-Z\s]+$/.test(inputValue) && inputValue.trim().length === inputValue.length;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return inputValue.length >= 5 && inputValue.length <= 100 && emailRegex.test(inputValue);

      case 'phone':
        const digitsOnly = inputValue.replace(/\+/g, '');
        return digitsOnly.length >= 7 && digitsOnly.length <= 15 && /^[\+]?[0-9]+$/.test(inputValue);

      case 'passportId':
        return inputValue.length >= 6 && inputValue.length <= 9 && /^[A-Z0-9]+$/.test(inputValue);

      default:
        return true;
    }
  };

  // Get validation error message
  const getValidationMessage = (inputValue: string, validationType?: string): string => {
    if (!validationType || !showValidation) return "";

    switch (validationType) {
      case 'fullName':
        if (inputValue.length === 0) return "";
        if (inputValue.length < 2) return "Name must be at least 2 characters";
        if (inputValue.length > 50) return "Name cannot exceed 50 characters";
        if (!/^[a-zA-Z\s]+$/.test(inputValue)) return "Name can only contain letters and spaces";
        if (inputValue.trim().length !== inputValue.length) return "Name cannot start or end with spaces";
        return "";

      case 'email':
        if (inputValue.length === 0) return "";
        if (inputValue.length < 5) return "Email must be at least 5 characters";
        if (inputValue.length > 100) return "Email cannot exceed 100 characters";
        if (inputValue.includes(' ')) return "Email cannot contain spaces";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue)) return "Please enter a valid email address";
        return "";

      case 'phone':
        if (inputValue.length === 0) return "";
        const digitsOnly = inputValue.replace(/\+/g, '');
        if (digitsOnly.length < 7) return "Phone number must be at least 7 digits";
        if (digitsOnly.length > 15) return "Phone number cannot exceed 15 digits";
        if (!/^[\+]?[0-9]+$/.test(inputValue)) return "Phone number can only contain digits and optional + for country code";
        return "";

      case 'passportId':
        if (inputValue.length === 0) return "";
        if (inputValue.length < 6) return "Passport ID must be at least 6 characters";
        if (inputValue.length > 9) return "Passport ID cannot exceed 9 characters";
        if (!/^[A-Z0-9]+$/i.test(inputValue)) return "Passport ID can only contain letters and numbers";
        return "";

      default:
        return "";
    }
  };

  // Update validation state when value changes
  useEffect(() => {
    if (showValidation && validationType) {
      const valid = isValidInput(value, validationType);
      const errorMessage = getValidationMessage(value, validationType);
      setIsValid(valid);
      setValidationError(errorMessage);
    }
  }, [value, validationType, showValidation]);

  // Use external error if provided, otherwise use internal validation
  const displayError = externalError || validationError;
  const displayIsValid = externalError ? !externalError : isValid;

  const handleInputChange = (inputValue: string) => {
    const validatedValue = validateInput(inputValue, validationType);
    onChange(validatedValue);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm sm:text-base font-normal text-[#2B2B2B] mb-2 text-left"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Left Icon */}
        {icon != null && (
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <div className="h-4 w-4 sm:h-5 sm:w-5 text-[#2B2B2B]/50">
              {icon}
            </div>
          </div>
        )}

        {/* Input Field */}
        <input
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          className={`w-full ${icon != null ? 'pl-10 sm:pl-12' : 'pl-3 sm:pl-4'} ${
            rightIcon ? 'pr-10 sm:pr-12' : 'pr-3 sm:pr-4'
          } py-3 sm:py-4 bg-white border ${
            (showValidation && validationType && value.length > 0) || externalError
              ? displayIsValid 
                ? 'border-green-500 focus:ring-green-500' 
                : 'border-red-500 focus:ring-red-500'
              : 'border-[#D9D9D9] focus:ring-[#E4590F]'
          } rounded-2xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-sm sm:text-base`}
          placeholder={placeholder}
          required={required}
          {...props}
        />

        {/* Right Icon (optional) */}
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-[#2B2B2B]/50 hover:text-[#E4590F] transition-colors"
          >
            <div className="h-4 w-4 sm:h-5 sm:w-5">
              {rightIcon}
            </div>
          </button>
        )}

        {/* Validation Icon */}
        {((showValidation && validationType && value.length > 0) || externalError) && (
          <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none">
            <div className={`h-4 w-4 sm:h-5 sm:w-5 ${rightIcon ? 'mr-8' : ''}`}>
              {displayIsValid ? (
                <svg className="text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation Message */}
      {displayError && (
        <p className="text-red-500 text-xs sm:text-sm mt-1 text-left animate-fadeIn">
          {displayError}
        </p>
      )}
    </div>
  );
};

export default InputField;