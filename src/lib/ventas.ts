import { prisma } from "@/lib/prisma";
import { DEFAULT_USD_PEN_RATE } from "@/utils/currency";

/* ------------------------------------------------------------------ */
/*  Tipos                                                              */
/* ------------------------------------------------------------------ */

export interface CheckoutItemInput {
  productId: string;
  categoryKey: string;
  qty: number;
}

export interface CheckoutLine {
  productId: string;
  categoryKey: string;
  nombre: string;
  marca: string;
  precioUsd: number;
  unitAmountCents: number;
  imagenUrl: string | null;
  qty: number;
}

interface ProductRow {
  id: string;
  nombre: string;
  marca: string;
  precio: unknown; // Decimal | number | null
  moneda?: string | null;
  stock?: number | null;
  imagenUrl?: string | null;
}

interface ProductDelegate {
  findUnique: (args: { where: { id: string } }) => Promise<ProductRow | null>;
  updateMany: (args: {
    where: { id: string; stock: { gte: number } };
    data: { stock: { decrement: number } };
  }) => Promise<{ count: number }>;
}

/* ------------------------------------------------------------------ */
/*  Mapa categoryKey -> delegate Prisma                                */
/* ------------------------------------------------------------------ */

const MODEL_MAP: Record<string, ProductDelegate> = {
  cpu: prisma.cpu as unknown as ProductDelegate,
  motherboard: prisma.motherboard as unknown as ProductDelegate,
  ram: prisma.ram as unknown as ProductDelegate,
  gpu: prisma.gpu as unknown as ProductDelegate,
  cooler: prisma.cooler as unknown as ProductDelegate,
  case: prisma.case as unknown as ProductDelegate,
  psu: prisma.psu as unknown as ProductDelegate,
  ssd: prisma.ssd as unknown as ProductDelegate,
  monitor: prisma.monitor as unknown as ProductDelegate,
};

export const CATEGORY_KEYS = Object.keys(MODEL_MAP);

/* ------------------------------------------------------------------ */
/*  Tipo de cambio                                                     */
/* ------------------------------------------------------------------ */

/** Última tasa de venta (USD→PEN). Fallback a la constante por defecto. */
export async function getUsdRate(): Promise<number> {
  const row = await prisma.tipoCambio.findFirst({ orderBy: { fecha: "desc" } });
  if (row) return Number(row.venta);
  return DEFAULT_USD_PEN_RATE;
}

/* ------------------------------------------------------------------ */
/*  Productos                                                          */
/* ------------------------------------------------------------------ */

type FoundProduct = {
  productId: string;
  categoryKey: string;
  nombre: string;
  marca: string;
  imagenUrl: string | null;
};

export async function findProduct(
  categoryKey: string,
  productId: string,
): Promise<FoundProduct | null> {
  const delegate = MODEL_MAP[categoryKey];
  if (!delegate) return null;
  const row = await delegate.findUnique({ where: { id: productId } });
  if (!row) return null;
  return {
    productId: row.id,
    categoryKey,
    nombre: row.nombre,
    marca: row.marca,
    imagenUrl: row.imagenUrl ?? null,
  };
}

async function productPriceUsd(
  categoryKey: string,
  productId: string,
  rate: number,
): Promise<number | null> {
  const delegate = MODEL_MAP[categoryKey];
  if (!delegate) return null;
  const row = await delegate.findUnique({ where: { id: productId } });
  if (!row || row.precio == null) return null;
  const raw = Number(row.precio);
  if (row.moneda === "PEN") return raw / rate;
  return raw;
}

/* ------------------------------------------------------------------ */
/*  Stock                                                              */
/* ------------------------------------------------------------------ */

type StockEntry = { categoryKey: string; productId: string; qty: number };

/**
 * Descuenta stock de varios productos usando el `updateMany` con guard
 * `stock >= qty`. Acepta un mapa de delegates (p. ej. el del $transaction).
 * No lanza: si no hay disponibilidad, simplemente no descuenta.
 */
export async function decrementStocks(
  entries: StockEntry[],
  map: Record<string, ProductDelegate> = MODEL_MAP,
): Promise<void> {
  for (const entry of entries) {
    const delegate = map[entry.categoryKey];
    if (!delegate) continue;
    await delegate.updateMany({
      where: { id: entry.productId, stock: { gte: entry.qty } },
      data: { stock: { decrement: entry.qty } },
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Número de pedido (PED-2026-XXXX)                                   */
/* ------------------------------------------------------------------ */

export async function generateVentaNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.venta.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });
  return `PED-${year}-${String(count + 1).padStart(4, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Checkout: agregar carrito y calcular en USD                        */
/* ------------------------------------------------------------------ */

/**
 * Une ítems duplicados, re-consulta los productos y valida stock.
 * Devuelve las líneas ya convertidas a USD. Lanza Error con mensaje amigable.
 */
export async function buildCheckoutLines(
  inputs: CheckoutItemInput[],
): Promise<CheckoutLine[]> {
  const rate = await getUsdRate();

  const merged = new Map<string, CheckoutItemInput>();
  for (const item of inputs) {
    if (!item || !item.productId || !item.categoryKey) continue;
    const key = `${item.categoryKey}:${item.productId}`;
    const qty = Math.min(Math.max(Math.trunc(item.qty) || 1, 1), 10);
    const prev = merged.get(key);
    merged.set(key, { ...item, qty: Math.min((prev?.qty ?? 0) + qty, 10) });
  }

  const lines: CheckoutLine[] = [];
  for (const item of [...merged.values()]) {
    const product = await findProduct(item.categoryKey, item.productId);
    if (!product) {
      throw new Error("Uno de los productos ya no está disponible.");
    }

    const priceUsd = await productPriceUsd(item.categoryKey, item.productId, rate);
    if (priceUsd == null || priceUsd <= 0) {
      throw new Error(`${product.nombre} no tiene precio asignado.`);
    }

    const stock = await prismaStock(item.categoryKey, item.productId);
    if (stock == null || stock < item.qty) {
      throw new Error(
        `${product.nombre} no tiene stock suficiente (disponible: ${stock ?? 0}).`,
      );
    }

    lines.push({
      productId: product.productId,
      categoryKey: product.categoryKey,
      nombre: product.nombre,
      marca: product.marca,
      imagenUrl: product.imagenUrl,
      precioUsd: priceUsd,
      unitAmountCents: Math.round(priceUsd * 100),
      qty: item.qty,
    });
  }

  return lines;
}

async function prismaStock(
  categoryKey: string,
  productId: string,
): Promise<number | null> {
  const delegate = MODEL_MAP[categoryKey];
  if (!delegate) return null;
  const row = await delegate.findUnique({ where: { id: productId } });
  return row?.stock ?? null;
}

/* ------------------------------------------------------------------ */
/*  Totales (todo en centavos para no perder precisión)                */
/* ------------------------------------------------------------------ */

export function buildTotals(lines: CheckoutLine[]) {
  const subtotalCents = lines.reduce(
    (sum, l) => sum + l.unitAmountCents * l.qty,
    0,
  );
  const igvCents = Math.round(subtotalCents * 0.18);
  const totalCents = subtotalCents + igvCents;
  return {
    subtotalCents,
    igvCents,
    totalCents,
    subtotalUsd: subtotalCents / 100,
    igvUsd: igvCents / 100,
    totalUsd: totalCents / 100,
  };
}

/** devuelve nombre/marca/imagen para el line item de un producto */
export function productMeta(line: CheckoutLine) {
  return {
    productId: line.productId,
    categoryKey: line.categoryKey,
    marca: line.marca,
  };
}