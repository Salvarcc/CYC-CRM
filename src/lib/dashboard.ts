import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Métricas del dashboard admin — consultas unificadas + cache        */
/*                                                                      */
/*  Reemplaza los ~14 round-trips del route original por:               */
/*    1. UNION ALL de las 9 tablas de producto (inventario)             */
/*    2. 3 counts de cotizaciones en una sola query                     */
/*    3. count de clientes                                              */
/*    4. recent quotes (join acotado)                                   */
/*  Todo envuelto en unstable_cache (revalidate 30s) para no golpear    */
/*  la base con cada render/request. auth() queda FUERA del cache.      */
/* ------------------------------------------------------------------ */

export interface LowStockItem {
  id: string;
  nombre: string;
  stock: number;
  status: "Crítico" | "Bajo";
}

export interface RecentQuote {
  id: string;
  client: string;
  date: string;
  components: string;
  total: string;
  status: string;
  statusColor: string;
}

export interface DashboardGeneral {
  totalProducts: number;
  inventoryValue: number;
  totalCotizaciones: number;
  pendingCotizaciones: number;
  monthCotizaciones: number;
  totalClientes: number;
  lowStock: LowStockItem[];
}

/* Las tablas usan el nombre del modelo (sin @@map).
   `precio` es Decimal en Cpu..Case y Float en Psu/Ssd/Monitor,
   por eso se unifica con `::float8` para que UNION ALL sea consistente. */
const INVENTORY_TABLES = [
  "Cpu",
  "Motherboard",
  "Ram",
  "Gpu",
  "Cooler",
  "Case",
  "Psu",
  "Ssd",
  "Monitor",
] as const;

const INVENTORY_UNION_SQL = INVENTORY_TABLES.map(
  (t) =>
    `SELECT id, nombre, stock, COALESCE(precio, 0)::float8 AS precio FROM "${t}" WHERE oculto = false`,
).join(" UNION ALL ");

type InventoryRow = {
  id: string;
  nombre: string;
  stock: number;
  precio: number;
};

type QuoteStatsRow = {
  total: number;
  pending: number;
  month: number;
};

async function computeDashboardGeneral(): Promise<DashboardGeneral> {
  const [inventoryRows, quoteStats, totalClientes] = await Promise.all([
    prisma.$queryRawUnsafe<InventoryRow[]>(INVENTORY_UNION_SQL),
    prisma.$queryRaw<
      QuoteStatsRow[]
    >`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE "expiresAt" > now())::int AS pending,
        COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('month', now()))::int AS month
      FROM "Cotizacion"`,
    prisma.cliente.count(),
  ]);

  const totalProducts = inventoryRows.length;
  const inventoryValue = inventoryRows.reduce(
    (acc, row) => acc + (Number(row.precio) || 0) * (row.stock || 0),
    0,
  );

  const lowStock = inventoryRows
    .filter((row) => Number(row.stock) <= 5)
    .sort((a, b) => Number(a.stock) - Number(b.stock))
    .slice(0, 6)
    .map((row) => ({
      id: row.id,
      nombre: row.nombre,
      stock: Number(row.stock),
      status: Number(row.stock) <= 0 ? ("Crítico" as const) : ("Bajo" as const),
    }));

  return {
    totalProducts,
    inventoryValue,
    totalCotizaciones: quoteStats[0]?.total ?? 0,
    pendingCotizaciones: quoteStats[0]?.pending ?? 0,
    monthCotizaciones: quoteStats[0]?.month ?? 0,
    totalClientes,
    lowStock,
  };
}

async function computeRecentQuotes(): Promise<RecentQuote[]> {
  const now = new Date();
  const pending = await prisma.cotizacion.findMany({
    where: { expiresAt: { gt: now } },
    select: {
      numero: true,
      createdAt: true,
      moneda: true,
      totalPrice: true,
      cliente: { select: { nombre: true } },
      items: { select: { nombre: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return pending.map((c) => ({
    id: c.numero,
    client: c.cliente.nombre,
    date: c.createdAt.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    components: c.items.map((i) => i.nombre).join(", "),
    total: `${c.moneda === "PEN" ? "S/." : "$"}${Number(c.totalPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    status: "Pendiente",
    statusColor: "warning",
  }));
}

const CACHE_REVALIDATE_SECONDS = 30;

export const getDashboardGeneral = unstable_cache(
  computeDashboardGeneral,
  ["admin-dashboard-general"],
  { revalidate: CACHE_REVALIDATE_SECONDS },
);

export const getRecentQuotes = unstable_cache(
  computeRecentQuotes,
  ["admin-dashboard-recent-quotes"],
  { revalidate: CACHE_REVALIDATE_SECONDS },
);