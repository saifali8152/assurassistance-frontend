import React, { useState, useRef, useEffect } from "react";
import { useCurrency, CURRENCIES } from "../context/CurrencyContext";
import { useTranslation } from "react-i18next";
import { DollarSign, ChevronDown } from "lucide-react";

const CurrencySelector: React.FC = () => {
  const { currency, currencyInfo, setCurrency } = useCurrency();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currencies = [
    { code: "XOF" as const, name: t("currency.cfaFranc", "CFA Franc") },
    { code: "USD" as const, name: t("currency.usd", "US Dollar") },
    { code: "EUR" as const, name: t("currency.eur", "Euro") },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (selectedCurrency: typeof currency) => {
    setCurrency(selectedCurrency);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-[#D9D9D9] rounded-xl px-4 py-2.5 hover:border-[#E4590F] transition-all duration-200 min-w-[140px] cursor-pointer group"
      >
        <DollarSign className="w-5 h-5 text-[#E4590F] group-hover:text-[#C94A0D]" />
        <span className="text-[#2B2B2B] text-sm font-normal flex-1 text-left">
          {currencyInfo.symbol} {currencyInfo.code}
        </span>
        <ChevronDown
          size={16}
          className={`text-[#E4590F] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn">
          {currencies.map((curr) => (
            <button
              key={curr.code}
              type="button"
              onClick={() => handleSelect(curr.code)}
              className={`w-full px-4 py-2.5 text-left text-sm font-normal transition-colors ${
                currency === curr.code
                  ? "bg-[#E4590F]/10 text-[#E4590F] font-medium"
                  : "text-[#2B2B2B] hover:bg-[#D9D9D9]/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{CURRENCIES[curr.code].symbol}</span>
                <span>{curr.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;

