import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { COUNTRIES } from "../constants/countries";
import { getCountryLabel, filterCountriesByQuery } from "../utils/countryLabels";

interface CountrySearchMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  icon: React.ReactNode;
  required?: boolean;
  className?: string;
  label?: string;
  disabled?: boolean;
}

const CountrySearchMultiSelect: React.FC<CountrySearchMultiSelectProps> = ({
  value,
  onChange,
  placeholder,
  icon,
  required = false,
  className = "",
  label,
  disabled = false
}) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const lang = i18n.language || "en";

  const filtered = useMemo(
    () => filterCountriesByQuery(COUNTRIES, query, lang),
    [query, lang]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    if (isOpen && !disabled) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchRef.current?.focus(), 0);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, disabled]);

  const handleToggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const handleRemove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(value.filter((item) => item !== option));
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm sm:text-base font-normal text-[#2B2B2B] mb-2 text-left">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 bg-white border border-[#D9D9D9] rounded-xl px-4 py-3 sm:py-4 transition-all duration-200 group min-h-[52px] ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-[#E4590F]"
        }`}
      >
        <div className="h-4 w-4 sm:h-5 sm:w-5 text-[#2B2B2B]/50 transition-colors flex-shrink-0">{icon}</div>
        <div className="flex-1 text-left">
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {value.slice(0, 3).map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#E4590F]/10 text-[#E4590F] rounded-md text-xs font-medium max-w-full"
                >
                  <span className="truncate">{getCountryLabel(item, lang)}</span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => handleRemove(item, e)}
                    className="hover:bg-[#E4590F]/20 rounded-full p-0.5 shrink-0 disabled:opacity-40"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {value.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 bg-[#D9D9D9]/30 text-[#2B2B2B] rounded-md text-xs font-medium">
                  +{value.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[#2B2B2B]/40">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-[#2B2B2B]/60 group-hover:text-[#E4590F] transition-all duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full mt-2 left-0 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg z-[60] overflow-hidden animate-fadeIn flex flex-col max-h-72">
          <div className="p-2 border-b border-[#D9D9D9] shrink-0">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("countrySearch.placeholder", "Type to filter countries…")}
              className="w-full px-3 py-2 text-sm border border-[#D9D9D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E4590F]/30"
            />
          </div>
          <div className="overflow-y-auto py-1.5 min-h-0">
            {filtered.length === 0 ? (
              <div className="px-4 py-2.5 text-sm text-[#2B2B2B]/60">{t("countrySearch.noMatch", "No matching country")}</div>
            ) : (
              filtered.map((option) => {
                const selected = value.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleToggle(option)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-normal transition-all duration-150 ${
                      selected
                        ? "bg-[#E4590F]/10 text-[#E4590F] font-medium"
                        : "text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]"
                    }`}
                  >
                    <span>{getCountryLabel(option, lang)}</span>
                    {selected && <Check className="w-4 h-4 text-[#E4590F] flex-shrink-0" />}
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

export default CountrySearchMultiSelect;
