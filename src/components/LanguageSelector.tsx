import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown, Check } from "lucide-react";

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const change = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
    setIsOpen(false);
  };

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white border border-[#D9D9D9] rounded-xl px-4 py-2.5 hover:border-[#E4590F] transition-all duration-200 min-w-[160px] cursor-pointer group"
        type="button"
      >
        <Globe className="w-5 h-5 text-[#E4590F] group-hover:text-[#C94A0D] transition-colors flex-shrink-0" />
        <span className="text-[#2B2B2B] text-sm font-medium flex-1 text-left">
          {currentLanguage.flag} {currentLanguage.label}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-[#2B2B2B]/60 group-hover:text-[#E4590F] transition-all duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn">
          <div className="py-1.5">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => change(language.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-normal transition-all duration-150 ${
                  i18n.language === language.code
                    ? 'bg-[#E4590F]/10 text-[#E4590F] font-medium'
                    : 'text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]'
                }`}
                type="button"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.label}</span>
                </span>
                {i18n.language === language.code && (
                  <Check className="w-4 h-4 text-[#E4590F] flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
