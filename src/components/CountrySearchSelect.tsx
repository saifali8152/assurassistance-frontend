import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { COUNTRIES } from "../constants/countries";
import { getCountryLabel, filterCountriesByQuery } from "../utils/countryLabels";

interface CountrySearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  required?: boolean;
  className?: string;
  label?: string;
  /** Compact layout for tables or tight layouts */
  dense?: boolean;
  disabled?: boolean;
}

/**
 * Single country select — stores canonical English name; shows localized label.
 * Typing filters the list.
 */
const CountrySearchSelect: React.FC<CountrySearchSelectProps> = ({
  value,
  onChange,
  placeholder,
  icon,
  required = false,
  className = "",
  label,
  dense = false,
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

  const displaySelected = value ? getCountryLabel(value, lang) : "";

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className={`block font-normal text-[#2B2B2B] mb-2 text-left ${dense ? "text-xs" : "text-sm sm:text-base"}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 bg-white border border-[#D9D9D9] rounded-xl px-3 transition-all duration-200 group ${
          dense ? "py-2 rounded-lg" : "gap-3 px-4 py-3 sm:py-4 rounded-xl"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className={`transition-colors text-[#2B2B2B]/50 flex-shrink-0 ${dense ? "h-3.5 w-3.5" : "h-4 w-4 sm:h-5 sm:w-5"}`}>{icon}</div>
        <span className={`text-[#2B2B2B] font-medium flex-1 text-left truncate ${dense ? "text-xs" : "text-sm"}`}>
          {displaySelected || <span className="text-[#2B2B2B]/40">{placeholder}</span>}
        </span>
        <ChevronDown className={`${dense ? "w-3.5 h-3.5" : "w-4 h-4"} transition-all duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute top-full mt-1 left-0 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg z-[60] overflow-hidden animate-fadeIn flex flex-col ${
            dense ? "max-h-52" : "max-h-72 mt-2"
          }`}
        >
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
              filtered.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-normal transition-all duration-150 ${
                    value === option
                      ? "bg-[#E4590F]/10 text-[#E4590F] font-medium"
                      : "text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]"
                  }`}
                >
                  <span>{getCountryLabel(option, lang)}</span>
                  {value === option && <Check className="w-4 h-4 text-[#E4590F] flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySearchSelect;
