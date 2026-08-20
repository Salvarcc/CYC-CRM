export type Currency = "USD" | "PEN";

/**
 * Default exchange rate: 1 USD ≈ 3.75 PEN
 * In production this should come from an API (e.g. SUNAT).
 */
export const DEFAULT_USD_PEN_RATE = 3.75;

/**
 * Fetch the latest exchange rate from the API.
 * Returns { compra, venta } or defaults if fetch fails.
 */
export async function fetchLatestRate(): Promise<{
  compra: number;
  venta: number;
}> {
  try {
    const res = await fetch("/api/tipo-cambio");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return { compra: data[0].compra, venta: data[0].venta };
    }
    if (data && typeof data === "object" && "compra" in data) {
      return { compra: data.compra, venta: data.venta };
    }
  } catch {
    // Fall back to defaults
  }
  return { compra: DEFAULT_USD_PEN_RATE - 0.03, venta: DEFAULT_USD_PEN_RATE };
}

export function convertPrice(
  amount: number,
  from: Currency,
  to: Currency,
  rate: number = DEFAULT_USD_PEN_RATE,
): number {
  if (from === to) return amount;
  if (from === "USD" && to === "PEN") return amount * rate;
  if (from === "PEN" && to === "USD") return amount / rate;
  return amount;
}

export function formatPrice(amount: number, currency: Currency): string {
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `S/${amount.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Takes a product price + its stored currency and returns the display string
 * in the user's preferred currency.
 */
export function displayPrice(
  precio: number | null,
  moneda: string,
  preferred: Currency,
  rate: number = DEFAULT_USD_PEN_RATE,
): string {
  if (precio == null) return formatPrice(0, preferred);
  const src = (moneda === "PEN" ? "PEN" : "USD") as Currency;
  const converted = convertPrice(precio, src, preferred, rate);
  return formatPrice(converted, preferred);
}

/**
 * Returns the numeric value in the user's preferred currency (no formatting).
 */
export function toPreferredCurrency(
  precio: number | null,
  moneda: string,
  preferred: Currency,
  rate: number = DEFAULT_USD_PEN_RATE,
): number {
  if (precio == null) return 0;
  const src = (moneda === "PEN" ? "PEN" : "USD") as Currency;
  return convertPrice(precio, src, preferred, rate);
}
