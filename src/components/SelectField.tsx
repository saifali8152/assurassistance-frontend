import React from "react";

interface SelectFieldProps {
  options: string[];
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  label?: string;
  id?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  options,
  placeholder,
  icon,
  value,
  onChange,
  required = false,
  className = "",
  label,
  id,
}) => {
  // Generate a unique ID if not provided
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={selectId}
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

        {/* Dropdown */}
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-200 text-sm sm:text-base appearance-none`}
          required={required}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option, index) => (
            <option key={index} value={option} className="text-black">
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectField;