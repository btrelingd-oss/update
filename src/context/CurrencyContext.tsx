import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyType = 'ETB' | 'USD';

export interface CurrencyContextValue {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  toggleCurrency: () => void;
  formatPrice: (amountInUSD: number, compact?: boolean) => string;
  convertPrice: (amountInUSD: number) => number;
  rate: number;
  currencySymbol: string;
  currencyLabel: string;
}

const ETB_RATE = 125; // 1 USD = 125 Ethiopian Birr (ETB)

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Ethiopian Birr (ETB) as requested
  const [currency, setCurrencyState] = useState<CurrencyType>(() => {
    try {
      const saved = localStorage.getItem('artisan_marketplace_currency');
      if (saved === 'USD' || saved === 'ETB') return saved;
    } catch {
      // fallback
    }
    return 'ETB'; // Default to Birr
  });

  useEffect(() => {
    try {
      localStorage.setItem('artisan_marketplace_currency', currency);
    } catch {
      // ignore
    }
  }, [currency]);

  const setCurrency = (c: CurrencyType) => {
    setCurrencyState(c);
  };

  const toggleCurrency = () => {
    setCurrencyState((prev) => (prev === 'ETB' ? 'USD' : 'ETB'));
  };

  const convertPrice = (amountInUSD: number): number => {
    if (currency === 'ETB') {
      return Number((amountInUSD * ETB_RATE).toFixed(2));
    }
    return Number(amountInUSD.toFixed(2));
  };

  const formatPrice = (amountInUSD: number, compact = false): string => {
    if (isNaN(amountInUSD)) return currency === 'ETB' ? 'ETB 0.00' : '$0.00';

    if (currency === 'ETB') {
      const etbValue = amountInUSD * ETB_RATE;
      if (compact) {
        return `ETB ${Math.round(etbValue).toLocaleString('en-US')}`;
      }
      return `ETB ${etbValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    if (compact) {
      return `$${Math.round(amountInUSD).toLocaleString('en-US')}`;
    }
    return `$${amountInUSD.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const currencySymbol = currency === 'ETB' ? 'ETB' : '$';
  const currencyLabel = currency === 'ETB' ? 'Ethiopian Birr (ETB)' : 'US Dollar (USD)';

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        formatPrice,
        convertPrice,
        rate: ETB_RATE,
        currencySymbol,
        currencyLabel,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextValue => {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      currency: 'ETB',
      setCurrency: () => {},
      toggleCurrency: () => {},
      formatPrice: (amount: number) => `ETB ${(amount * 125).toFixed(2)}`,
      convertPrice: (amount: number) => amount * 125,
      rate: 125,
      currencySymbol: 'ETB',
      currencyLabel: 'Ethiopian Birr (ETB)',
    };
  }
  return context;
};
