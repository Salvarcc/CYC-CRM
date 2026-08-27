import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface UnifiedProduct {
  id: string;
  nombre: string;
  marca: string;
  category: string;
  categoryKey: string;
  precio: number | null;
  moneda: string;
  stock: number;
  imagenUrl: string | null;
  createdAt: string;
  oculto: boolean;
  cotizador: boolean;
  attrs: Record<string, unknown>;
}

const CATEGORY_MAP: Record<string, string> = {
  cpu: "Procesadores",
  motherboard: "Placas Madre",
  ram: "Memoria RAM",
  gpu: "Tarjetas de Video",
  cooler: "Refrigeración",
  case: "Gabinetes",
  psu: "Fuentes de Poder",
  ssd: "Almacenamiento SSD",
  monitor: "Monitores",
};

function toUnified(
  item: Record<string, unknown>,
  categoryKey: string,
  attrKeys: string[],
): UnifiedProduct {
  const attrs: Record<string, unknown> = {};
  for (const key of attrKeys) {
    if (item[key] !== undefined && item[key] !== null) {
      attrs[key] = item[key];
    }
  }
  return {
    id: item.id as string,
    nombre: item.nombre as string,
    marca: item.marca as string,
    category: CATEGORY_MAP[categoryKey] ?? categoryKey,
    categoryKey,
    precio: item.precio != null ? Number(item.precio) : null,
    moneda: (item.moneda as string) ?? "USD",
    stock: item.stock as number,
    imagenUrl: (item.imagenUrl as string) ?? null,
    createdAt: (item.createdAt as string).toString(),
    oculto: (item.oculto as boolean) ?? false,
    cotizador: (item.cotizador as boolean) ?? true,
    attrs,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category"); // filter by categoryKey
  const inStock = searchParams.get("inStock"); // "true" = only in-stock
  const search = searchParams.get("search"); // search by nombre or marca
  const includeHidden = searchParams.get("includeHidden"); // "true" = include soft-deleted
  const cotizadorOnly = searchParams.get("cotizador"); // "true" = only cotizador-enabled

  const whereFilter = includeHidden === "true" ? undefined : { oculto: false };

  const queries: [string, Promise<unknown[]>][] = [
    ["cpu", prisma.cpu.findMany({ where: whereFilter, orderBy: { createdAt: "desc" } })],
    ["motherboard", prisma.motherboard.findMany({ where: whereFilter, orderBy: { createdAt: "desc" } })],
    ["ram", prisma.ram.findMany({ where: whereFilter, orderBy: { createdAt: "desc" } })],
    ["gpu", prisma.gpu.findMany({ where: whereFilter, orderBy: { createdAt: "desc" } })],
    ["cooler", prisma.cooler.findMany({ where: whereFilter, orderBy: { createdAt: "desc" } })],
    ["case", prisma.case.findMany({ where: whereFilter, orderBy: { createdAt: "desc" } })],
    ["psu", prisma.psu.findMany({ where: whereFilter, orderBy: { createdAt: "desc" } })],
    ["ssd", prisma.ssd.findMany({ where: whereFilter, orderBy: { createdAt: "desc" } })],
    ["monitor", prisma.monitor.findMany({ where: whereFilter, orderBy: { createdAt: "desc" } })],
  ];

  const ATTR_KEYS: Record<string, string[]> = {
    cpu: ["socket", "tipoMemoria", "requiereCooler", "tdp", "tieneGraficosIntegrados", "subcategoria"],
    motherboard: ["socket", "tipoMemoria", "factorForma", "ramSlots", "maxMemoriaGB", "subcategoria"],
    ram: ["tipoMemoria", "factorForma", "capacidadGB", "frecuenciaMHz", "subcategoria"],
    gpu: ["vramGB", "consumoRecomendadoFuenteWatts", "largoMm", "subcategoria"],
    cooler: ["socketsSoportados", "tdpSoportadoWatts", "tipoRefrigeracion", "numeroVentiladores", "subcategoria"],
    case: ["soportaFactoresForma", "largoMaxGpuMm", "tieneFuentePoder", "potenciaFuenteWatts", "soportaFanCoolerVentiladores", "subcategoria"],
    psu: ["potenciaWatts", "certificacion80Plus", "esModular", "factorForma", "subcategoria"],
    ssd: ["capacidadGB", "formato", "interfaz", "lecturaMBs", "escrituraMBs", "subcategoria"],
    monitor: ["tamano", "resolucion", "tipoPanel", "ratioAspecto", "tiempoRespuestaMs", "tasaRefrescoHz", "puertos", "subcategoria"],
  };

  // Filter which models to query
  const filteredQueries = category
    ? queries.filter(([key]) => key === category)
    : queries;

  const results = await Promise.all(
    filteredQueries.map(async ([key, query]) => {
      const items = await query;
      return (items as Record<string, unknown>[]).map((item) =>
        toUnified(item, key, ATTR_KEYS[key]),
      );
    }),
  );

  let products = results.flat();

  // Apply filters
  if (inStock === "true") {
    products = products.filter((p) => p.stock > 0);
  }
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.marca.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }
  if (cotizadorOnly === "true") {
    products = products.filter((p) => p.cotizador);
  }

  return NextResponse.json(products);
}
