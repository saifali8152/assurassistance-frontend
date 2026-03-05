import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

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
  // id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label 
          className="block text-sm sm:text-base font-normal text-[#2B2B2B] mb-2 text-left"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 bg-white border border-[#D9D9D9] rounded-xl px-4 py-3 sm:py-4 transition-all duration-200 cursor-pointer group"
      >
        {/* Left Icon */}
        <div className="h-4 w-4 sm:h-5 sm:w-5 transition-colors text-[#2B2B2B]/50 flex-shrink-0">
          {icon}
        </div>
        
        {/* Selected Value or Placeholder */}
        <span className="text-[#2B2B2B] text-sm font-medium flex-1 text-left">
          {value || <span className="text-[#2B2B2B]/40">{placeholder}</span>}
        </span>
        
        {/* Chevron Icon */}
        <ChevronDown 
          className={`w-4 h-4 transition-all duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn max-h-60 overflow-y-auto">
          <div className="py-1.5">
            {options.length === 0 ? (
              <div className="px-4 py-2.5 text-sm text-[#2B2B2B]/60">
                {placeholder}
              </div>
            ) : (
              options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-normal transition-all duration-150 ${
                    value === option
                      ? 'bg-[#E4590F]/10 text-[#E4590F] font-medium'
                      : 'text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]'
                  }`}
                  type="button"
                >
                  <span>{option}</span>
                  {value === option && (
                    <Check className="w-4 h-4 text-[#E4590F] flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectField;