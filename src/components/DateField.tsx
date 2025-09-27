import React, { useState, useRef, useEffect } from "react";

interface DateFieldProps {
  placeholder: string;
  icon: React.ReactNode;
  value: string; // Expected format: YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  label?: string;
  id?: string;
  readOnly?: boolean;
  minDate?: string; // YYYY-MM-DD format
  maxDate?: string; // YYYY-MM-DD format
}

const DateField: React.FC<DateFieldProps> = ({
  placeholder,
  icon,
  value,
  onChange,
  required = false,
  className = "",
  label,
  id,
  readOnly = false,
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generate a unique ID if not provided
  const inputId = id || `datefield-${Math.random().toString(36).substr(2, 9)}`;

  // Parse the value to display format
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    onChange(formattedDate);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    const selectedDate = value ? new Date(value) : null;
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isDisabled = 
        (minDate && date < new Date(minDate)) ||
        (maxDate && date > new Date(maxDate));
      
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled
      });
    }
    
    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
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
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-10">
          <div className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400">
            {icon}
          </div>
        </div>

        {/* Input Field */}
        <button
          type="button"
          id={inputId}
          onClick={() => !readOnly && setIsOpen(!isOpen)}
          className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-200 text-sm sm:text-base text-left ${
            readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-white/15'
          }`}
          disabled={!!readOnly}
        >
          {value ? formatDisplayDate(value) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </button>

        {/* Calendar Dropdown */}
        {isOpen && !readOnly && (
          <div className="absolute top-full mt-2 left-0 w-85 z-50">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-2xl">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => navigateMonth(-1)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <h3 className="text-white font-medium text-sm sm:text-base">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                
                <button
                  type="button"
                  onClick={() => navigateMonth(1)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekdays.map(day => (
                  <div key={day} className="text-center text-xs text-white/60 font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((dayObj, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => !dayObj.isDisabled && handleDateSelect(dayObj.date)}
                    disabled={!!dayObj.isDisabled}
                    className={`
                      aspect-square p-1 text-xs sm:text-sm rounded-lg transition-all duration-200 relative
                      ${dayObj.isCurrentMonth 
                        ? dayObj.isDisabled
                          ? 'text-white/30 cursor-not-allowed'
                          : 'text-white/90 hover:bg-white/20'
                        : 'text-white/40'
                      }
                      ${dayObj.isSelected 
                        ? 'bg-blue-500 text-white shadow-lg' 
                        : ''
                      }
                      ${dayObj.isToday && !dayObj.isSelected
                        ? 'ring-1 ring-blue-400 text-blue-300'
                        : ''
                      }
                    `}
                  >
                    {dayObj.day}
                  </button>
                ))}
              </div>

              {/* Today Button */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleDateSelect(new Date())}
                  className="w-full py-2 px-3 text-sm text-blue-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateField;