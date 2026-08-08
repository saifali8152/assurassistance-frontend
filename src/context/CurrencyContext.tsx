import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { getExchangeRates } from "../services/currencyService";

export type Currency = "XOF" | "USD" | "EUR";

interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  XOF: {
    code: "XOF",
    symbol: "CFA",
    name: "CFA Franc",
    locale: "fr-FR"
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    locale: "en-US"
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    locale: "fr-FR"
  }
};

// Fallback exchange rates (used while loading or if API fails)
const FALLBACK_RATES: Record<Currency, number> = {
  XOF: 1, // Base currency (no conversion needed)
  USD: 0.0016667, // 1 XOF = 0.0016667 USD (600 XOF = 1 USD, approximate market rate)
  EUR: 0.0015245, // 1 XOF = 0.0015245 EUR (655.957 XOF = 1 EUR, fixed rate)
};

interface CurrencyContextType {
  currency: Currency;
  currencyInfo: CurrencyInfo;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;
  /** Convert amount from XOF (legacy base) to the selected display currency. */
  convertCurrency: (amount: number) => number;
  /** Convert amount from a source currency into the selected display currency. */
  convertFrom: (amount: number, fromCurrency: string) => number;
  /** Format an amount that is stored in `fromCurrency` (not necessarily XOF). */
  formatFrom: (amount: number, fromCurrency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = "selected_currency";
const DEFAULT_CURRENCY: Currency = "XOF"; // CFA franc as default

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    // Initialize from localStorage or use default
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && (stored === "XOF" || stored === "USD" || stored === "EUR")) {
      return stored as Currency;
    }
    return DEFAULT_CURRENCY;
  });

  const [exchangeRates, setExchangeRates] = useState<Record<Currency, number>>(FALLBACK_RATES);

  // Fetch exchange rates on mount and periodically
  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        const rates = await getExchangeRates();
        setExchangeRates({
          XOF: 1,
          USD: rates.USD,
          EUR: rates.EUR,
        });
      } catch (error) {
        console.error('Error loading exchange rates:', error);
        // Keep fallback rates
      }
    };

    // Load rates immediately
    loadExchangeRates();

    // Refresh rates every 6 hours (API cache is 24 hours, but we refresh more frequently)
    const interval = setInterval(loadExchangeRates, 6 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Save to localStorage whenever currency changes
  useEffect(() => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }, [currency]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  };

  const currencyInfo = CURRENCIES[currency];

  // Convert amount from XOF (base currency) to selected currency
  const convertCurrency = (amount: number): number => {
    if (!amount || isNaN(amount)) return 0;
    return amount * exchangeRates[currency];
  };

  const convertFrom = (amount: number, fromCurrency: string = "XOF"): number => {
    if (!amount || isNaN(amount)) return 0;
    const from = (["XOF", "USD", "EUR"].includes(String(fromCurrency).toUpperCase())
      ? String(fromCurrency).toUpperCase()
      : "XOF") as Currency;
    if (from === currency) return amount;
    const inXof = from === "XOF" ? amount : amount / exchangeRates[from];
    return inXof * exchangeRates[currency];
  };

  const formatConverted = (convertedAmount: number): string => {
    const currencyData = CURRENCIES[currency];
    if (currency === "XOF") {
      return (
        new Intl.NumberFormat("fr-FR", {
          style: "decimal",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(convertedAmount) + " FCFA"
      );
    }
    return new Intl.NumberFormat(currencyData.locale, {
      style: "currency",
      currency: currencyData.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedAmount);
  };

  const formatCurrency = (amount: number): string => {
    if (!amount || isNaN(amount)) amount = 0;
    return formatConverted(convertCurrency(amount));
  };

  const formatFrom = (amount: number, fromCurrency: string = "XOF"): string => {
    if (!amount || isNaN(amount)) amount = 0;
    return formatConverted(convertFrom(amount, fromCurrency));
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyInfo,
        setCurrency,
        formatCurrency,
        convertCurrency,
        convertFrom,
        formatFrom,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};

