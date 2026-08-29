import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET — Métricas del dashboard admin (inventario, cotizaciones, etc.) */
/* ------------------------------------------------------------------ */

type ModelRow = {
  id: string;
  nombre: string;
  stock: number;
  precio: unknown;
  oculto: boolean;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // ── Inventario: contar productos activos y sumar valor (precio × stock) ──
  const [cpu, motherboard, ram, gpu, cooler, casee, psu, ssd, monitor] = await Promise.all([
    prisma.cpu.findMany({ where: { oculto: false } }),
    prisma.motherboard.findMany({ where: { oculto: false } }),
    prisma.ram.findMany({ where: { oculto: false } }),
    prisma.gpu.findMany({ where: { oculto: false } }),
    prisma.cooler.findMany({ where: { oculto: false } }),
    prisma.case.findMany({ where: { oculto: false } }),
    prisma.psu.findMany({ where: { oculto: false } }),
    prisma.ssd.findMany({ where: { oculto: false } }),
    prisma.monitor.findMany({ where: { oculto: false } }),
  ]);
  const allRows = [
    ...cpu,
    ...motherboard,
    ...ram,
    ...gpu,
    ...cooler,
    ...casee,
    ...psu,
    ...ssd,
    ...monitor,
  ] as ModelRow[];
  const totalProducts = allRows.length;
  const inventoryValue = allRows.reduce(
    (acc, row) => acc + (Number(row.precio) || 0) * (row.stock || 0),
    0,
  );

  // Productos con stock bajo / agotado para alertas
  const lowStock = allRows
    .filter((row) => Number(row.stock) <= 5)
    .sort((a, b) => Number(a.stock) - Number(b.stock))
    .slice(0, 6)
    .map((row) => ({
      id: row.id,
      nombre: row.nombre,
      stock: Number(row.stock),
      status: Number(row.stock) <= 0 ? "Crítico" : "Bajo",
    }));

  // ── Cotizaciones ──
  const [totalCotizaciones, pendingCotizaciones, monthCotizaciones] = await Promise.all([
    prisma.cotizacion.count(),
    prisma.cotizacion.count({ where: { expiresAt: { gt: now } } }),
    prisma.cotizacion.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);

  const pending = await prisma.cotizacion.findMany({
    where: { expiresAt: { gt: now } },
    include: {
      items: true,
      cliente: { select: { id: true, nombre: true, correo: true, telefono: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentQuotes = pending.map((c) => {
    const components = c.items.map((i) => i.nombre).join(", ");
    return {
      id: c.numero,
      client: c.cliente.nombre,
      date: c.createdAt.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      components,
      total: `${c.moneda === "PEN" ? "S/." : "$"}${Number(c.totalPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      status: "Pendiente",
      statusColor: "warning",
    };
  });

  // ── Clientes ──
  const totalClientes = await prisma.cliente.count();

  return NextResponse.json({
    totalProducts,
    inventoryValue,
    totalCotizaciones,
    pendingCotizaciones,
    monthCotizaciones,
    totalClientes,
    lowStock,
    recentQuotes,
  });
}
