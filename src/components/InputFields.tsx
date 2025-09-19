import React from "react";

interface InputFieldProps {
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  className?: string;
  label?: string;
  id?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  type,
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
  ...props
}) => {
  // Generate a unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm sm:text-base font-medium text-white/90 mb-2 text-left"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Left Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
          <div className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400">
            {icon}
          </div>
        </div>

        {/* Input Field */}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-10 sm:pl-12 ${
            rightIcon ? 'pr-10 sm:pr-12' : 'pr-3 sm:pr-4'
          } py-3 sm:py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-200 text-sm sm:text-base`}
          placeholder={placeholder}
          required={required}
          {...props}
        />

        {/* Right Icon (optional) */}
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <div className="h-4 w-4 sm:h-5 sm:w-5">
              {rightIcon}
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default InputField;