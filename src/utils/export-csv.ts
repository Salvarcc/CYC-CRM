export interface CsvRow {
  [key: string]: string | number | null | boolean;
}

const CATEGORY_ATTR_COLUMNS: Record<string, string[]> = {
  cpu: ["Subcategoría", "Socket", "Tipo Memoria", "TDP (W)", "Requiere Cooler", "Gráficos Integrados"],
  motherboard: ["Subcategoría", "Socket", "Tipo Memoria", "Factor Forma", "RAM Slots", "Max Memoria (GB)"],
  ram: ["Subcategoría", "Tipo Memoria", "Factor Forma", "Capacidad (GB)", "Frecuencia (MHz)"],
  gpu: ["Subcategoría", "VRAM (GB)", "PSU Rec. (W)", "Largo (mm)"],
  cooler: ["Subcategoría", "Sockets Soportados", "TDP Soportado (W)", "Tipo Refrigeración", "Nro. Ventiladores"],
  case: ["Subcategoría", "Factores Forma", "Largo Max GPU (mm)", "Fuente Poder", "Potencia Fuente (W)", "Max Ventiladores"],
  psu: ["Subcategoría", "Potencia (W)", "Certificación 80+", "Modular", "Factor Forma"],
};

const CATEGORY_ATTR_KEYS: Record<string, Record<string, string>> = {
  cpu: {
    subcategoria: "Subcategoría",
    socket: "Socket",
    tipoMemoria: "Tipo Memoria",
    tdp: "TDP (W)",
    requiereCooler: "Requiere Cooler",
    tieneGraficosIntegrados: "Gráficos Integrados",
  },
  motherboard: {
    subcategoria: "Subcategoría",
    socket: "Socket",
    tipoMemoria: "Tipo Memoria",
    factorForma: "Factor Forma",
    ramSlots: "RAM Slots",
    maxMemoriaGB: "Max Memoria (GB)",
  },
  ram: {
    subcategoria: "Subcategoría",
    tipoMemoria: "Tipo Memoria",
    factorForma: "Factor Forma",
    capacidadGB: "Capacidad (GB)",
    frecuenciaMHz: "Frecuencia (MHz)",
  },
  gpu: {
    subcategoria: "Subcategoría",
    vramGB: "VRAM (GB)",
    consumoRecomendadoFuenteWatts: "PSU Rec. (W)",
    largoMm: "Largo (mm)",
  },
  cooler: {
    subcategoria: "Subcategoría",
    socketsSoportados: "Sockets Soportados",
    tdpSoportadoWatts: "TDP Soportado (W)",
    tipoRefrigeracion: "Tipo Refrigeración",
    numeroVentiladores: "Nro. Ventiladores",
  },
  case: {
    subcategoria: "Subcategoría",
    soportaFactoresForma: "Factores Forma",
    largoMaxGpuMm: "Largo Max GPU (mm)",
    tieneFuentePoder: "Fuente Poder",
    potenciaFuenteWatts: "Potencia Fuente (W)",
    soportaFanCoolerVentiladores: "Max Ventiladores",
  },
  psu: {
    subcategoria: "Subcategoría",
    potenciaWatts: "Potencia (W)",
    certificacion80Plus: "Certificación 80+",
    esModular: "Modular",
    factorForma: "Factor Forma",
  },
};

function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCellValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function exportInventoryCsv(
  items: Array<{ categoryKey: string; nombre: string; marca: string; precio: number | null; moneda: string; stock: number; attrs: Record<string, unknown> }>,
  activeCategory: string,
) {
  const baseColumns = ["Nombre", "Marca", "Categoría", "Precio", "Moneda", "Stock"];

  const categoryKey = activeCategory === "Todos" ? null : activeCategory;

  let attrColumns: string[];
  if (categoryKey) {
    attrColumns = CATEGORY_ATTR_COLUMNS[categoryKey] || [];
  } else {
    const seen = new Set<string>();
    attrColumns = [];
    for (const cols of Object.values(CATEGORY_ATTR_COLUMNS)) {
      for (const c of cols) {
        if (!seen.has(c)) {
          seen.add(c);
          attrColumns.push(c);
        }
      }
    }
  }

  const headers = [...baseColumns, ...attrColumns];

  const rows: string[][] = [];
  for (const item of items) {
    const attrMap = CATEGORY_ATTR_KEYS[item.categoryKey] || {};
    const row: string[] = [
      item.nombre,
      item.marca,
      item.categoryKey,
      item.precio != null ? String(item.precio) : "",
      item.moneda,
      String(item.stock),
    ];

    for (const col of attrColumns) {
      const key = Object.entries(attrMap).find(([, v]) => v === col)?.[0];
      if (key && item.attrs[key] !== undefined) {
        row.push(formatCellValue(item.attrs[key]));
      } else {
        row.push("");
      }
    }

    rows.push(row);
  }

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `inventario_${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
