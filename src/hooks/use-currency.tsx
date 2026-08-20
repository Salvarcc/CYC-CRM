"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Currency } from "@/utils/currency";
import { fetchLatestRate } from "@/utils/currency";

interface CurrencyCtx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  toggle: () => void;
  rate: { compra: number; venta: number };
}

const CurrencyContext = createContext<CurrencyCtx>({
  currency: "USD",
  setCurrency: () => {},
  toggle: () => {},
  rate: { compra: 3.72, venta: 3.75 },
});

const STORAGE_KEY = "cym-currency";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [rate, setRate] = useState({ compra: 3.72, venta: 3.75 });

  /* hydrate from localStorage */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "USD" || saved === "PEN") setCurrencyState(saved);
    } catch {}
  }, []);

  /* fetch latest rate from API */
  useEffect(() => {
    fetchLatestRate().then(setRate);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    const next: Currency = currency === "USD" ? "PEN" : "USD";
    setCurrency(next);
  }, [currency, setCurrency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, toggle, rate }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
