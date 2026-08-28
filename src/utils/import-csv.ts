const VALID_CATEGORIES = ["cpu", "motherboard", "ram", "gpu", "cooler", "case", "psu", "ssd", "monitor"];

const COLUMN_TO_FIELD: Record<string, Record<string, string>> = {
  cpu: {
    "Subcategoría": "subcategoria",
    "Socket": "socket",
    "Tipo Memoria": "tipoMemoria",
    "TDP (W)": "tdp",
    "Requiere Cooler": "requiereCooler",
    "Gráficos Integrados": "tieneGraficosIntegrados",
  },
  motherboard: {
    "Subcategoría": "subcategoria",
    "Socket": "socket",
    "Tipo Memoria": "tipoMemoria",
    "Factor Forma": "factorForma",
    "RAM Slots": "ramSlots",
    "Max Memoria (GB)": "maxMemoriaGB",
  },
  ram: {
    "Subcategoría": "subcategoria",
    "Tipo Memoria": "tipoMemoria",
    "Factor Forma": "factorForma",
    "Capacidad (GB)": "capacidadGB",
    "Frecuencia (MHz)": "frecuenciaMHz",
  },
  gpu: {
    "Subcategoría": "subcategoria",
    "VRAM (GB)": "vramGB",
    "PSU Rec. (W)": "consumoRecomendadoFuenteWatts",
    "Largo (mm)": "largoMm",
  },
  cooler: {
    "Subcategoría": "subcategoria",
    "Sockets Soportados": "socketsSoportados",
    "TDP Soportado (W)": "tdpSoportadoWatts",
    "Tipo Refrigeración": "tipoRefrigeracion",
    "Nro. Ventiladores": "numeroVentiladores",
  },
  case: {
    "Subcategoría": "subcategoria",
    "Factores Forma": "soportaFactoresForma",
    "Largo Max GPU (mm)": "largoMaxGpuMm",
    "Fuente Poder": "tieneFuentePoder",
    "Potencia Fuente (W)": "potenciaFuenteWatts",
    "Max Ventiladores": "soportaFanCoolerVentiladores",
  },
  psu: {
    "Subcategoría": "subcategoria",
    "Potencia (W)": "potenciaWatts",
    "Certificación 80+": "certificacion80Plus",
    "Modular": "esModular",
    "Factor Forma": "factorForma",
  },
  ssd: {
    "Subcategoría": "subcategoria",
    "Capacidad (GB)": "capacidadGB",
    "Formato": "formato",
    "Interfaz": "interfaz",
    "Lectura (MB/s)": "lecturaMBs",
    "Escritura (MB/s)": "escrituraMBs",
  },
  monitor: {
    "Subcategoría": "subcategoria",
    "Tamaño": "tamano",
    "Resolución": "resolucion",
    "Tipo Panel": "tipoPanel",
    "Relación de Aspecto": "ratioAspecto",
    "Tiempo Respuesta (ms)": "tiempoRespuestaMs",
    "Tasa Refresco (Hz)": "tasaRefrescoHz",
    "Puertos": "puertos",
  },
};

export interface ParsedRow {
  categoryKey: string;
  raw: string[];
  form: Record<string, string>;
}

export interface ValidationError {
  rowIndex: number;
  field: string;
  message: string;
}

export interface ParseResult {
  valid: ParsedRow[];
  errors: ValidationError[];
  headers: string[];
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

function parseBool(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === "sí" || v === "si" || v === "true" || v === "1" || v === "yes";
}

function toFormValue(value: string, field: string): string {
  const v = value.trim();
  if (!v) return "";

  if (field === "requiereCooler" || field === "tieneGraficosIntegrados" || field === "tieneFuentePoder" || field === "esModular") {
    return parseBool(v) ? "true" : "false";
  }

  return v;
}

export function parseCsv(csvText: string): ParseResult {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());

  if (lines.length < 2) {
    return { valid: [], errors: [{ rowIndex: 0, field: "", message: "El CSV debe tener al menos una cabecera y una fila de datos" }], headers: [] };
  }

  const headers = parseCsvLine(lines[0]);
  const valid: ParsedRow[] = [];
  const errors: ValidationError[] = [];

  const catIdx = headers.findIndex((h) => h === "Categoría");
  if (catIdx === -1) {
    return { valid: [], errors: [{ rowIndex: 0, field: "Categoría", message: "Falta la columna 'Categoría'" }], headers };
  }

  const nameIdx = headers.findIndex((h) => h === "Nombre");
  const brandIdx = headers.findIndex((h) => h === "Marca");
  const priceIdx = headers.findIndex((h) => h === "Precio");
  const currencyIdx = headers.findIndex((h) => h === "Moneda");
  const stockIdx = headers.findIndex((h) => h === "Stock");

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const rowNum = i + 1;

    const categoryKey = (cells[catIdx] || "").trim();
    if (!categoryKey) {
      errors.push({ rowIndex: rowNum, field: "Categoría", message: "Categoría vacía" });
      continue;
    }
    if (!VALID_CATEGORIES.includes(categoryKey)) {
      errors.push({ rowIndex: rowNum, field: "Categoría", message: `"${categoryKey}" no es una categoría válida (use: ${VALID_CATEGORIES.join(", ")})` });
      continue;
    }

    const nombre = nameIdx >= 0 ? cells[nameIdx]?.trim() : "";
    if (!nombre) {
      errors.push({ rowIndex: rowNum, field: "Nombre", message: "Nombre vacío" });
      continue;
    }

    const marca = brandIdx >= 0 ? cells[brandIdx]?.trim() : "";
    if (!marca) {
      errors.push({ rowIndex: rowNum, field: "Marca", message: "Marca vacía" });
      continue;
    }

    const form: Record<string, string> = {
      nombre,
      marca,
      moneda: currencyIdx >= 0 ? cells[currencyIdx]?.trim() || "USD" : "USD",
      stock: stockIdx >= 0 ? cells[stockIdx]?.trim() || "0" : "0",
    };

    if (priceIdx >= 0) {
      const priceVal = cells[priceIdx]?.trim();
      if (priceVal) form.precio = priceVal;
    }

    const attrMap = COLUMN_TO_FIELD[categoryKey] || {};
    for (let h = 0; h < headers.length; h++) {
      const field = attrMap[headers[h]];
      if (field) {
        const cellVal = h < cells.length ? cells[h]?.trim() || "" : "";
        form[field] = toFormValue(cellVal, field);
      }
    }

    valid.push({ categoryKey, raw: cells, form });
  }

  return { valid, errors, headers };
}

export async function importRows(
  rows: ParsedRow[],
  onProgress?: (current: number, total: number) => void,
): Promise<{ created: number; failed: number; failDetails: { row: number; name: string; error: string }[] }> {
  let created = 0;
  let failed = 0;
  const failDetails: { row: number; name: string; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    onProgress?.(i + 1, rows.length);
    const { categoryKey, form } = rows[i];

    const payload = buildPayload(categoryKey, form);
    try {
      const res = await fetch(`/api/${categoryKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "Error desconocido");
        failed++;
        failDetails.push({ row: i + 2, name: form.nombre, error: errText });
      } else {
        created++;
      }
    } catch (err) {
      failed++;
      failDetails.push({ row: i + 2, name: form.nombre, error: String(err) });
    }
  }

  return { created, failed, failDetails };
}

function buildPayload(categoryKey: string, form: Record<string, string>) {
  const base = {
    nombre: form.nombre,
    marca: form.marca,
    precio: form.precio ? parseFloat(form.precio) : null,
    moneda: form.moneda || "USD",
    stock: form.stock ? parseInt(form.stock, 10) : 0,
    imagenUrl: null as string | null,
    subcategoria: form.subcategoria || null,
  };

  switch (categoryKey) {
    case "cpu":
      return {
        ...base,
        socket: form.socket || "",
        tipoMemoria: form.tipoMemoria || "",
        requiereCooler: form.requiereCooler === "true",
        tdp: form.tdp ? parseInt(form.tdp, 10) : 0,
        tieneGraficosIntegrados: form.tieneGraficosIntegrados === "true",
      };
    case "motherboard":
      return {
        ...base,
        socket: form.socket || "",
        tipoMemoria: form.tipoMemoria || "",
        factorForma: form.factorForma || "",
        ramSlots: form.ramSlots ? parseInt(form.ramSlots, 10) : 0,
        maxMemoriaGB: form.maxMemoriaGB ? parseInt(form.maxMemoriaGB, 10) : 0,
      };
    case "ram":
      return {
        ...base,
        tipoMemoria: form.tipoMemoria || "",
        factorForma: form.factorForma || "",
        capacidadGB: form.capacidadGB ? parseInt(form.capacidadGB, 10) : 0,
        frecuenciaMHz: form.frecuenciaMHz ? parseInt(form.frecuenciaMHz, 10) : 0,
      };
    case "gpu":
      return {
        ...base,
        vramGB: form.vramGB ? parseInt(form.vramGB, 10) : 0,
        consumoRecomendadoFuenteWatts: form.consumoRecomendadoFuenteWatts
          ? parseInt(form.consumoRecomendadoFuenteWatts, 10)
          : 0,
        largoMm: form.largoMm ? parseInt(form.largoMm, 10) : 0,
      };
    case "cooler":
      return {
        ...base,
        socketsSoportados: form.socketsSoportados
          ? form.socketsSoportados.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        tdpSoportadoWatts: form.tdpSoportadoWatts
          ? parseInt(form.tdpSoportadoWatts, 10)
          : 0,
        tipoRefrigeracion: form.tipoRefrigeracion || "Aire",
        numeroVentiladores: form.numeroVentiladores
          ? parseInt(form.numeroVentiladores, 10)
          : 1,
      };
    case "case":
      return {
        ...base,
        soportaFactoresForma: form.soportaFactoresForma
          ? form.soportaFactoresForma.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        largoMaxGpuMm: form.largoMaxGpuMm ? parseInt(form.largoMaxGpuMm, 10) : 0,
        tieneFuentePoder: form.tieneFuentePoder === "true",
        potenciaFuenteWatts: form.potenciaFuenteWatts
          ? parseInt(form.potenciaFuenteWatts, 10)
          : 0,
        soportaFanCoolerVentiladores: form.soportaFanCoolerVentiladores
          ? parseInt(form.soportaFanCoolerVentiladores, 10)
          : 0,
      };
    case "psu":
      return {
        ...base,
        potenciaWatts: form.potenciaWatts ? parseInt(form.potenciaWatts, 10) : 0,
        certificacion80Plus: form.certificacion80Plus || "Bronze",
        esModular: form.esModular === "true",
        factorForma: form.factorForma || "ATX",
      };
    case "ssd":
      return {
        ...base,
        capacidadGB: form.capacidadGB ? parseInt(form.capacidadGB, 10) : 0,
        formato: form.formato || "",
        interfaz: form.interfaz || null,
        lecturaMBs: form.lecturaMBs ? parseInt(form.lecturaMBs, 10) : null,
        escrituraMBs: form.escrituraMBs ? parseInt(form.escrituraMBs, 10) : null,
      };
    case "monitor":
      return {
        ...base,
        tamano: form.tamano || "",
        resolucion: form.resolucion || "",
        tipoPanel: form.tipoPanel || null,
        ratioAspecto: form.ratioAspecto || null,
        tiempoRespuestaMs: form.tiempoRespuestaMs ? parseInt(form.tiempoRespuestaMs, 10) : null,
        tasaRefrescoHz: form.tasaRefrescoHz ? parseInt(form.tasaRefrescoHz, 10) : null,
        puertos: form.puertos || null,
      };
    default:
      return base;
  }
}
