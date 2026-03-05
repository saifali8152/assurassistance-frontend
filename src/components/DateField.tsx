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
  const [showYearPicker, setShowYearPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generate a unique ID if not provided
  const inputId = id || `datefield-${Math.random().toString(36).substr(2, 9)}`;

  // Parse the value to display format
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    // Parse YYYY-MM-DD format directly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    // Use local timezone to avoid date shifting
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`; // YYYY-MM-DD
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
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    const selectedDate = value ? (() => {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    })() : null;
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isDisabled = 
        (minDate && (() => {
          const [minYear, minMonth, minDay] = minDate.split('-').map(Number);
          const minDateObj = new Date(minYear, minMonth - 1, minDay);
          return date < minDateObj;
        })()) ||
        (maxDate && (() => {
          const [maxYear, maxMonth, maxDay] = maxDate.split('-').map(Number);
          const maxDateObj = new Date(maxYear, maxMonth - 1, maxDay);
          return date > maxDateObj;
        })());
      
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

  const navigateYear = (direction: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setFullYear(prev.getFullYear() + direction);
      return newMonth;
    });
  };

  const selectYear = (year: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setFullYear(year);
      return newMonth;
    });
    setShowYearPicker(false);
  };

  // Generate years for year picker (current year ± 50 years)
  const generateYearRange = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 50; i <= currentYear + 50; i++) {
      years.push(i);
    }
    return years;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
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
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-10">
          <div className="h-4 w-4 sm:h-5 sm:w-5 text-[#2B2B2B]/50">
            {icon}
          </div>
        </div>

        {/* Input Field */}
        <button
          type="button"
          id={inputId}
          onClick={() => !readOnly && setIsOpen(!isOpen)}
          className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white border border-[#D9D9D9] rounded-2xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent transition-all duration-200 text-sm sm:text-base text-left ${
            readOnly ? 'cursor-default bg-[#F5F5F5]' : 'cursor-pointer hover:border-[#E4590F]'
          }`}
          disabled={!!readOnly}
        >
          {value ? formatDisplayDate(value) : (
            <span className="text-[#2B2B2B]/40">{placeholder}</span>
          )}
        </button>

        {/* Calendar Dropdown */}
        {isOpen && !readOnly && (
          <div className="absolute top-full mt-2 left-0 w-85 z-50">
            <div className="bg-white border border-[#D9D9D9] rounded-2xl p-4 shadow-2xl">
              {/* Month/Year Navigation */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => navigateYear(-1)}
                    className="p-2 rounded-lg hover:bg-[#D9D9D9]/30 text-[#2B2B2B] hover:text-[#E4590F] transition-colors"
                    title="Previous Year"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateMonth(-1)}
                    className="p-2 rounded-lg hover:bg-[#D9D9D9]/30 text-[#2B2B2B] hover:text-[#E4590F] transition-colors"
                    title="Previous Month"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowYearPicker(!showYearPicker)}
                    className="px-3 py-1 rounded-lg hover:bg-[#D9D9D9]/30 text-[#2B2B2B] hover:text-[#E4590F] transition-colors font-medium text-sm sm:text-base"
                  >
                    {monthNames[currentMonth.getMonth()]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowYearPicker(!showYearPicker)}
                    className="px-3 py-1 rounded-lg hover:bg-[#D9D9D9]/30 text-[#2B2B2B] hover:text-[#E4590F] transition-colors font-medium text-sm sm:text-base"
                  >
                    {currentMonth.getFullYear()}
                  </button>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => navigateMonth(1)}
                    className="p-2 rounded-lg hover:bg-[#D9D9D9]/30 text-[#2B2B2B] hover:text-[#E4590F] transition-colors"
                    title="Next Month"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateYear(1)}
                    className="p-2 rounded-lg hover:bg-[#D9D9D9]/30 text-[#2B2B2B] hover:text-[#E4590F] transition-colors"
                    title="Next Year"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Year Picker */}
              {showYearPicker && (
                <div className="mb-4 p-3 bg-[#D9D9D9]/10 rounded-lg max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-2">
                    {generateYearRange().map((year) => {
                      const isCurrentYear = year === new Date().getFullYear();
                      const isSelectedYear = year === currentMonth.getFullYear();
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => selectYear(year)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSelectedYear
                              ? 'bg-[#E4590F] text-white'
                              : isCurrentYear
                              ? 'bg-[#E4590F]/20 text-[#E4590F] hover:bg-[#E4590F]/30'
                              : 'bg-white text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]'
                          }`}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekdays.map(day => (
                  <div key={day} className="text-center text-xs text-[#2B2B2B]/60 font-medium py-2">
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
                          ? 'text-[#2B2B2B]/30 cursor-not-allowed'
                          : 'text-[#2B2B2B] hover:bg-[#E4590F]/10'
                        : 'text-[#2B2B2B]/40'
                      }
                      ${dayObj.isSelected 
                        ? 'bg-[#E4590F] text-white shadow-lg' 
                        : ''
                      }
                      ${dayObj.isToday && !dayObj.isSelected
                        ? 'ring-1 ring-[#E4590F] text-[#E4590F]'
                        : ''
                      }
                    `}
                  >
                    {dayObj.day}
                  </button>
                ))}
              </div>

              {/* Today Button */}
              <div className="mt-4 pt-3 border-t border-[#D9D9D9]">
                <button
                  type="button"
                  onClick={() => handleDateSelect(new Date())}
                  className="w-full py-2 px-3 text-sm text-[#E4590F] hover:bg-[#E4590F]/10 rounded-lg transition-colors cursor-pointer"
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