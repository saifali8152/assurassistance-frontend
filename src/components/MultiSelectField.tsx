import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, X } from "lucide-react";

interface MultiSelectFieldProps {
  options: string[];
  placeholder: string;
  icon: React.ReactNode;
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  className?: string;
  label?: string;
  id?: string;
}

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
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

  const handleToggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(item => item !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const handleRemove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(item => item !== option));
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
        className="w-full flex items-center gap-3 bg-white border border-[#D9D9D9] rounded-xl px-4 py-3 sm:py-4 hover:border-[#E4590F] transition-all duration-200 cursor-pointer group min-h-[52px]"
      >
        {/* Left Icon */}
        <div className="h-4 w-4 sm:h-5 sm:w-5 text-[#2B2B2B]/50 transition-colors flex-shrink-0">
          {icon}
        </div>
        
        {/* Selected Values or Placeholder */}
        <div className="flex-1 text-left">
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {value.slice(0, 2).map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#E4590F]/10 text-[#E4590F] rounded-md text-xs font-medium"
                >
                  {item}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(item, e)}
                    className="hover:bg-[#E4590F]/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {value.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 bg-[#D9D9D9]/30 text-[#2B2B2B] rounded-md text-xs font-medium">
                  +{value.length - 2} more
                </span>
              )}
            </div>
          ) : (
            <span className="text-[#2B2B2B]/40">{placeholder}</span>
          )}
        </div>
        
        {/* Chevron Icon */}
        <ChevronDown 
          className={`w-4 h-4 text-[#2B2B2B]/60 group-hover:text-[#E4590F] transition-all duration-200 flex-shrink-0 ${
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
              options.map((option, index) => {
                const isSelected = value.includes(option);
                return (
                  <button
                    key={index}
                    onClick={() => handleToggle(option)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-normal transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#E4590F]/10 text-[#E4590F] font-medium'
                        : 'text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]'
                    }`}
                    type="button"
                  >
                    <span>{option}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#E4590F] flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectField;

