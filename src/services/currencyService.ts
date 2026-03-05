// Currency exchange rate service using exchangerate.host (free API, no key required)

const EXCHANGE_RATE_API = 'https://api.exchangerate.host/latest';
const CACHE_KEY = 'currency_rates_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface ExchangeRateCache {
  rates: {
    XOF: number;
    USD: number;
    EUR: number;
  };
  timestamp: number;
}

// Fallback rates (used if API fails or as initial values)
const FALLBACK_RATES = {
  XOF: 1,
  USD: 0.0016667, // 600 XOF = 1 USD
  EUR: 0.0015245, // 655.957 XOF = 1 EUR (fixed rate)
};

/**
 * Fetch exchange rates from API
 * Base currency is XOF, we need rates for USD and EUR
 * XOF is pegged to EUR at a fixed rate: 1 EUR = 655.957 XOF
 */
export const fetchExchangeRates = async (): Promise<{ XOF: number; USD: number; EUR: number }> => {
  try {
    // First, try to fetch EUR to USD rate (most reliable)
    const response = await fetch(`${EXCHANGE_RATE_API}?base=EUR&symbols=USD`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    
    // Check if API response is valid
    if (!data.success || !data.rates || !data.rates.USD) {
      throw new Error('Invalid API response');
    }

    // XOF is pegged to EUR at fixed rate: 1 EUR = 655.957 XOF
    const XOF_PER_EUR = 655.957;
    const EUR_TO_USD = data.rates.USD;

    // Calculate rates from XOF base:
    // 1 XOF = 1 / 655.957 EUR
    // 1 XOF = (1 / 655.957) * EUR_TO_USD USD
    const XOF_TO_EUR = 1 / XOF_PER_EUR;
    const XOF_TO_USD = XOF_TO_EUR * EUR_TO_USD;

    return {
      XOF: 1,
      USD: XOF_TO_USD,
      EUR: XOF_TO_EUR,
    };
  } catch (error) {
    console.warn('Failed to fetch exchange rates from API, using fallback:', error);
    return FALLBACK_RATES;
  }
};

/**
 * Get cached exchange rates or fetch new ones if cache is expired
 */
export const getExchangeRates = async (): Promise<{ XOF: number; USD: number; EUR: number }> => {
  try {
    // Check cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const cache: ExchangeRateCache = JSON.parse(cached);
      const now = Date.now();
      
      // Use cached rates if still valid (within 24 hours)
      if (now - cache.timestamp < CACHE_DURATION) {
        return cache.rates;
      }
    }

    // Fetch new rates
    const rates = await fetchExchangeRates();
    
    // Cache the new rates
    const cache: ExchangeRateCache = {
      rates,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    
    return rates;
  } catch (error) {
    console.warn('Error getting exchange rates, using fallback:', error);
    return FALLBACK_RATES;
  }
};

/**
 * Clear the exchange rate cache (useful for testing or forcing refresh)
 */
export const clearExchangeRateCache = (): void => {
  localStorage.removeItem(CACHE_KEY);
};

