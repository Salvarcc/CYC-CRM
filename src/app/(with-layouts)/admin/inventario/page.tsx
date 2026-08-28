"use client";

import { SearchIcon } from "@/components/common/header/icons";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/tailgrids/core/card";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/tailgrids/core/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/tailgrids/core/input-group";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";
import { MenuDotsIcon } from "@/utils/icon";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/common/image-uploader/image-uploader";
import { exportInventoryCsv } from "@/utils/export-csv";
import { parseCsv, importRows, type ParseResult, type ValidationError } from "@/utils/import-csv";
import { EyeOffIcon, EyeOnIcon, FilterIcon, MinusIcon, PlusIcon, RefreshIcon } from "./icons";
import { getSubcategorias } from "./subcategorias";
import {
  SOCKET_OPTIONS,
  TIPO_MEMORIA_OPTIONS,
  CPU_TDP_OPTIONS,
  FACTOR_FORMA_OPTIONS,
  RAM_SLOTS_OPTIONS,
  MAX_MEMORIA_OPTIONS,
  RAM_CAPACIDAD_OPTIONS,
  RAM_FRECUENCIA_OPTIONS,
  VRAM_OPTIONS,
  GPU_PSU_REC_OPTIONS,
  GPU_LARGO_OPTIONS,
  COOLER_TDP_OPTIONS,
  COOLER_VENTILADORES_OPTIONS,
  CASE_GPU_MAX_OPTIONS,
  CASE_FAN_SLOTS_OPTIONS,
  CASE_FUENTE_POTENCIA_OPTIONS,
  PSU_POTENCIA_OPTIONS,
  CERTIFICACION_80PLUS_OPTIONS,
  PSU_FACTOR_FORMA_OPTIONS,
  TIPO_REFRIGERACION_OPTIONS,
  SSD_CAPACIDAD_OPTIONS,
  SSD_FORMATO_OPTIONS,
  SSD_LECTURA_OPTIONS,
  SSD_ESCRITURA_OPTIONS,
  MONITOR_TAMANO_OPTIONS,
  MONITOR_RESOLUCION_OPTIONS,
  MONITOR_PANEL_OPTIONS,
  MONITOR_RATIO_OPTIONS,
  MONITOR_RESPUESTA_OPTIONS,
  MONITOR_REFRESCO_OPTIONS,
  MONITOR_PUERTOS_OPTIONS,
  formValueToArray,
  toggleArrayValue,
} from "./technical-attrs";

type BadgeColor =
  | "gray"
  | "primary"
  | "error"
  | "warning"
  | "success"
  | "cyan"
  | "sky"
  | "blue"
  | "violet"
  | "purple"
  | "pink"
  | "rose"
  | "orange";

interface Product {
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

const CATEGORIES = [
  "Todos",
  "Procesadores",
  "Placas Madre",
  "Memoria RAM",
  "Tarjetas de Video",
  "Refrigeración",
  "Gabinetes",
  "Fuentes de Poder",
  "Almacenamiento SSD",
  "Monitores",
] as const;

const CATEGORY_KEY_MAP: Record<string, string> = {
  Procesadores: "cpu",
  "Placas Madre": "motherboard",
  "Memoria RAM": "ram",
  "Tarjetas de Video": "gpu",
  Refrigeración: "cooler",
  Gabinetes: "case",
  "Fuentes de Poder": "psu",
  "Almacenamiento SSD": "ssd",
  Monitores: "monitor",
};

function groupByCategory(rows: { categoryKey: string }[]) {
  const groups: Record<string, number> = {};
  for (const r of rows) {
    groups[r.categoryKey] = (groups[r.categoryKey] || 0) + 1;
  }
  return groups;
}

const ADD_PRODUCT_CATEGORIES = [
  { value: "cpu", label: "Procesadores" },
  { value: "motherboard", label: "Placas Madre" },
  { value: "ram", label: "Memoria RAM" },
  { value: "gpu", label: "Tarjetas de Video" },
  { value: "cooler", label: "Refrigeración" },
  { value: "case", label: "Gabinetes" },
  { value: "psu", label: "Fuentes de Poder" },
  { value: "ssd", label: "Almacenamiento SSD" },
  { value: "monitor", label: "Monitores" },
];

const PLACEHOLDER_IMG = "https://placehold.co/40x40/f3f4f6/6b7280?text=PC";

// Atributos técnicos por categoría para el minifiltro (bajo las pestañas de categoría).
const CATEGORY_ATTR_FILTERS: Record<string, { key: string; label: string }[]> = {
  cpu: [
    { key: "socket", label: "Socket" },
    { key: "tipoMemoria", label: "Tipo Memoria" },
  ],
  motherboard: [
    { key: "socket", label: "Socket" },
    { key: "tipoMemoria", label: "Tipo Memoria" },
    { key: "factorForma", label: "Factor Forma" },
  ],
  ram: [
    { key: "tipoMemoria", label: "Tipo Memoria" },
    { key: "capacidadGB", label: "Capacidad" },
  ],
  gpu: [{ key: "vramGB", label: "VRAM (GB)" }],
  cooler: [{ key: "tipoRefrigeracion", label: "Tipo Refrigeración" }],
  case: [],
  psu: [{ key: "potenciaWatts", label: "Potencia (W)" }],
  ssd: [
    { key: "capacidadGB", label: "Capacidad (GB)" },
    { key: "formato", label: "Formato" },
    { key: "interfaz", label: "Interfaz" },
  ],
  monitor: [
    { key: "tamano", label: "Tamaño" },
    { key: "resolucion", label: "Resolución" },
    { key: "tipoPanel", label: "Panel" },
    { key: "tasaRefrescoHz", label: "Refresco (Hz)" },
  ],
};

function buildAttrFilterOptions(activeCategory: string): { key: string; label: string }[] {
  if (activeCategory !== "Todos") {
    return CATEGORY_ATTR_FILTERS[activeCategory] ?? [];
  }
  const seen = new Map<string, string>();
  for (const [, filters] of Object.entries(CATEGORY_ATTR_FILTERS)) {
    for (const f of filters) {
      if (!seen.has(f.key)) seen.set(f.key, f.label);
    }
  }
  return Array.from(seen, ([key, label]) => ({ key, label }));
}


function formatPrice(n: number | null, moneda?: string): string {
  if (n == null) return "—";
  if (moneda === "USD") {
    return `$ ${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  }
  return `S/. ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}

function getStockStatus(stock: number): { label: string; color: BadgeColor } {
  if (stock === 0) return { label: "Agotado", color: "error" };
  if (stock <= 5) return { label: "Stock Bajo", color: "warning" };
  return { label: "En Stock", color: "success" };
}

function getApiEndpoint(categoryKey: string): string {
  return `/api/${categoryKey}`;
}

function getAddPayload(categoryKey: string, form: Record<string, string>) {
  const base = {
    nombre: form.nombre,
    marca: form.marca,
    precio: form.precio ? parseFloat(form.precio) : null,
    moneda: form.moneda || "USD",
    stock: form.stock ? parseInt(form.stock, 10) : 0,
    imagenUrl: form.imagenUrl || null,
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
          ? form.socketsSoportados.split(",").map((s: string) => s.trim())
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
          ? form.soportaFactoresForma.split(",").map((s: string) => s.trim())
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

export default function InventarioPage() {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addCategory, setAddCategory] = useState("cpu");
  const [addForm, setAddForm] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [addMode, setAddMode] = useState<"manual" | "csv">("manual");
  const [csvStep, setCsvStep] = useState<"select" | "preview" | "importing" | "done">("select");
  const [csvParseResult, setCsvParseResult] = useState<ParseResult | null>(null);
  const [csvProgress, setCsvProgress] = useState({ current: 0, total: 0 });
  const [csvResult, setCsvResult] = useState<{ created: number; failed: number; failDetails: { row: number; name: string; error: string }[] } | null>(null);
  const csvFileRef = useRef<HTMLInputElement>(null);

  const [subcategoriaFilter, setSubcategoriaFilter] = useState("");
  const [attrFilters, setAttrFilters] = useState<Record<string, string>>({});

  const filteredItems = useMemo(() => {
    const activeAttrFilters = buildAttrFilterOptions(activeCategory);
    return items.filter((item) => {
      if (subcategoriaFilter) {
        const sub = (item.attrs.subcategoria as string) ?? "";
        if (sub !== subcategoriaFilter) return false;
      }
      for (const f of activeAttrFilters) {
        const value = (item.attrs as Record<string, unknown>)[f.key];
        const selected = attrFilters[f.key];
        if (selected && String(value ?? "") !== selected) return false;
      }
      return true;
    });
  }, [items, activeCategory, subcategoriaFilter, attrFilters]);

  const resetMinifilters = useCallback(() => {
    setSubcategoriaFilter("");
    setAttrFilters({});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("includeHidden", "true");
      if (activeCategory !== "Todos") {
        const key = CATEGORY_KEY_MAP[activeCategory];
        if (key) params.set("category", key);
      }
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar productos");
      const data = await res.json();
      setItems(data);
    } catch {
      toast.error("No se pudieron cargar los productos");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleStockAdjust = async (item: Product, delta: number) => {
    const newStock = Math.max(0, item.stock + delta);
    try {
      const endpoint = getApiEndpoint(item.categoryKey);
      const res = await fetch(`${endpoint}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      if (!res.ok) throw new Error("Error al actualizar stock");
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, stock: newStock } : p)),
      );
      toast.success(`Stock actualizado: ${item.nombre} → ${newStock}`);
    } catch {
      toast.error("No se pudo actualizar el stock");
    }
  };

  const handleToggleOculto = async (item: Product) => {
    const nuevoOculto = !item.oculto;
    try {
      const endpoint = getApiEndpoint(item.categoryKey);
      const res = await fetch(`${endpoint}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oculto: nuevoOculto }),
      });
      if (!res.ok) throw new Error("Error al actualizar visibilidad");
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, oculto: nuevoOculto } : p)),
      );
      toast.success(
        nuevoOculto
          ? `${item.nombre} oculto del catálogo`
          : `${item.nombre} visible en el catálogo`,
      );
    } catch {
      toast.error("No se pudo actualizar la visibilidad");
    }
  };

  const handleToggleCotizador = async (item: Product) => {
    const nuevo = !item.cotizador;
    try {
      const endpoint = getApiEndpoint(item.categoryKey);
      const res = await fetch(`${endpoint}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, cotizador: nuevo }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, cotizador: nuevo } : p)),
      );
      toast.success(
        nuevo
          ? `${item.nombre} habilitado en el cotizador`
          : `${item.nombre} deshabilitado del cotizador`,
      );
    } catch {
      toast.error("No se pudo actualizar el cotizador");
    }
  };

  const handleAddProduct = async () => {
    if (!addForm.nombre?.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    setSubmitting(true);
    try {
      const endpoint = getApiEndpoint(addCategory);
      const payload = getAddPayload(addCategory, addForm);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al crear producto");
      toast.success("Producto agregado correctamente");
      setAddModalOpen(false);
      setAddForm({});
      fetchProducts();
    } catch {
      toast.error("No se pudo agregar el producto");
    } finally {
      setSubmitting(false);
    }
  };

  const resetCsv = useCallback(() => {
    setCsvStep("select");
    setCsvParseResult(null);
    setCsvProgress({ current: 0, total: 0 });
    setCsvResult(null);
    if (csvFileRef.current) csvFileRef.current.value = "";
  }, []);

  const handleCsvFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsv(text);
      setCsvParseResult(parsed);
      setCsvStep("preview");
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const handleCsvImport = useCallback(async () => {
    if (!csvParseResult?.valid.length) return;
    setCsvStep("importing");
    setCsvProgress({ current: 0, total: csvParseResult.valid.length });
    const res = await importRows(csvParseResult.valid, (current, total) => {
      setCsvProgress({ current, total });
    });
    setCsvResult(res);
    setCsvStep("done");
    if (res.failed === 0) {
      toast.success(`${res.created} productos importados correctamente`);
    } else {
      toast.warning(`Importados: ${res.created} | Fallidos: ${res.failed}`);
    }
    fetchProducts();
  }, [csvParseResult, fetchProducts]);

  const totalProducts = filteredItems.length;
  const inStock = filteredItems.filter((i) => i.stock > 0).length;
  const lowStock = filteredItems.filter((i) => i.stock > 0 && i.stock <= 5).length;
  const outOfStock = filteredItems.filter((i) => i.stock === 0).length;
  const ocultos = filteredItems.filter((i) => i.oculto).length;

  return (
    <div className="mt-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between px-2 lg:px-6">
        <div>
          <h1 className="mb-1 text-[28px] leading-8 font-medium text-text-primary">
            Inventario de Componentes
          </h1>
          <p className="text-sm leading-5 text-text-tertiary">
            Gestiona el stock de componentes de PC de la tienda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            appearance="outline"
            className="flex items-center gap-2"
            onPress={() => {
              const categoryKey = activeCategory === "Todos" ? "Todos" : (CATEGORY_KEY_MAP[activeCategory] ?? activeCategory);
              exportInventoryCsv(items, categoryKey);
              toast.success(`CSV exportado: ${items.length} productos`);
            }}
          >
            <span className="material-symbols-outlined text-base">download</span>
            Descargar CSV
          </Button>
          <Button
            onClick={() => {
              setAddForm({});
              setAddCategory("cpu");
              setAddModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Agregar Producto
          </Button>
        </div>
      </div>

      <div className="space-y-5 px-2 lg:px-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm leading-5 font-medium text-text-tertiary">
                    Total Productos
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-text-primary">
                    {loading ? "—" : totalProducts}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-primary-background">
                  <span className="text-badge-primary-icon-color material-symbols-outlined text-xl">
                    inventory_2
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm leading-5 font-medium text-text-tertiary">
                    En Stock
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-green-600">
                    {loading ? "—" : inStock}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-success-background">
                  <span className="text-badge-success-icon-color material-symbols-outlined text-xl">
                    check_circle
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm leading-5 font-medium text-text-tertiary">
                    Stock Bajo
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-orange-600">
                    {loading ? "—" : lowStock}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-warning-background">
                  <span className="text-badge-warning-icon-color material-symbols-outlined text-xl">
                    warning
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm leading-5 font-medium text-text-tertiary">
                    Agotados
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-red-600">
                    {loading ? "—" : outOfStock}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-error-background">
                  <span className="text-badge-error-icon-color material-symbols-outlined text-xl">
                    block
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm leading-5 font-medium text-text-tertiary">
                    Ocultos
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-text-secondary">
                    {loading ? "—" : ocultos}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-background-gray-primary">
                  <span className="text-icon-tertiary material-symbols-outlined text-xl">
                    visibility_off
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader className="mb-6">
            <CardTitle>Componentes</CardTitle>
            <div className="flex items-center gap-1.5">
              <InputGroup className="py-1.5">
                <InputGroupAddon align="inline-start" className="pr-0 text-icon-tertiary">
                  <SearchIcon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Buscar por nombre, marca..."
                  className="py-0 pl-2 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
              <Button
                appearance="outline"
                className="h-8 w-8 p-1.5 text-icon-tertiary"
                onClick={fetchProducts}
              >
                <RefreshIcon />
              </Button>
            </div>
          </CardHeader>

          {/* Category Tabs */}
          <div className="mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-brand-500 text-white"
                    : "bg-background-gray-primary text-text-secondary hover:bg-background-gray-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Minifiltro: subcategoría + atributos técnicos según la categoría activa */}
          {!loading && items.length > 0 && (() => {
            const attrDefs = buildAttrFilterOptions(activeCategory);
            const subcategorias = Array.from(
              new Set(
                items
                  .map((i) => (i.attrs.subcategoria as string) ?? "")
                  .filter(Boolean),
              ),
            ).sort();
            const hasActive = subcategoriaFilter || Object.keys(attrFilters).some((k) => attrFilters[k]);
            const isSubActive = !!subcategoriaFilter;
            return (
              <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-card-border bg-background-gray-primary/40 p-3">
                {isSubActive && (
                  <button
                    onClick={() => setSubcategoriaFilter("")}
                    className="mb-1.5 flex cursor-pointer items-center gap-1 rounded-md bg-brand-500/10 px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-500/20"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    {subcategoriaFilter}
                  </button>
                )}
                <div className="min-w-40 flex-1 sm:flex-none">
                  <label className="mb-1 block text-xs font-medium text-text-tertiary">
                    Subcategoría
                  </label>
                  <select
                    className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                    value={subcategoriaFilter}
                    onChange={(e) => setSubcategoriaFilter(e.target.value)}
                  >
                    <option value="">Todas</option>
                    {subcategorias.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {attrDefs.map((f) => {
                  const values = items
                    .map((i) => String((i.attrs as Record<string, unknown>)[f.key] ?? ""))
                    .filter(Boolean);
                  const options = Array.from(new Set(values)).sort();
                  if (options.length === 0) return null;
                  return (
                    <div key={f.key} className="min-w-36 flex-1 sm:flex-none">
                      <label className="mb-1 block text-xs font-medium text-text-tertiary">
                        {f.label}
                      </label>
                      <select
                        className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                        value={attrFilters[f.key] ?? ""}
                        onChange={(e) =>
                          setAttrFilters((prev) => ({
                            ...prev,
                            [f.key]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Todos</option>
                        {options.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
                <Button
                  appearance="outline"
                  className="mb-0.5 h-9 px-3 text-xs"
                  onPress={resetMinifilters}
                  isDisabled={!hasActive}
                >
                  <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                  Limpiar
                </Button>
              </div>
            );
          })()}

          {/* Table */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <span className="text-sm text-text-tertiary">Cargando productos...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <span className="material-symbols-outlined text-4xl text-text-tertiary">
                  inventory_2
                </span>
                <p className="text-sm text-text-tertiary">
                  No hay productos que coincidan con los filtros.
                </p>
                <Button
                  onClick={() => {
                    setAddForm({});
                    setAddCategory("cpu");
                    setAddModalOpen(true);
                  }}
                  appearance="outline"
                  className="mt-2"
                >
                  Agregar primer producto
                </Button>
              </div>
            ) : (
              <TableRoot className="w-full min-w-200 rounded-none border-none">
                <TableHeader>
                  <TableRow className="[&_th]:border-t">
                    <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                      Producto
                    </TableHead>
                    <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                      Categoría
                    </TableHead>
                    <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                      Subcategoría
                    </TableHead>
                    <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                      Marca
                    </TableHead>
                    <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                      Precio
                    </TableHead>
                    <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                      Stock
                    </TableHead>
                    <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                      Estado
                    </TableHead>
                    <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                      <div className="flex items-center justify-center">Acción</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const status = getStockStatus(item.stock);
                    return (
                      <TableRow key={item.id} className={`[&_td]:border-none ${item.oculto ? "opacity-50" : ""}`}>
                        <TableCell className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.imagenUrl || PLACEHOLDER_IMG}
                              alt={item.nombre}
                              className="size-10 rounded-lg object-cover"
                            />
                            <div>
                              <p className="text-sm leading-5 font-medium text-text-primary">
                                {item.nombre}
                              </p>
                              <p className="text-xs leading-4 text-text-tertiary">
                                {item.id.slice(0, 12)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-sm leading-5 text-text-secondary">
                          {item.category}
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-sm leading-5 text-text-secondary">
                          {(item.attrs.subcategoria as string) || "—"}
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-sm leading-5 font-medium text-text-primary">
                          {item.marca}
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-sm leading-5 font-medium text-text-primary">
                          {formatPrice(item.precio, item.moneda)}
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStockAdjust(item, -1)}
                              className="flex size-6 items-center justify-center rounded border border-card-border text-text-tertiary transition-colors hover:bg-background-gray-primary hover:text-text-primary"
                            >
                              <MinusIcon />
                            </button>
                            <span className="min-w-[2ch] text-center text-sm font-medium text-text-primary">
                              {item.stock}
                            </span>
                            <button
                              onClick={() => handleStockAdjust(item, 1)}
                              className="flex size-6 items-center justify-center rounded border border-card-border text-text-tertiary transition-colors hover:bg-background-gray-primary hover:text-text-primary"
                            >
                              <PlusIcon />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <Badge color={status.color} size="sm">
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={item.cotizador}
                              aria-label={item.cotizador ? "Deshabilitar del cotizador" : "Habilitar en el cotizador"}
                              onClick={() => handleToggleCotizador(item)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                                item.cotizador
                                  ? "bg-brand-500"
                                  : "bg-gray-300"
                              }`}
                            >
                              <span
                                className={`inline-block size-3.5 rounded-full bg-white shadow-xs transition-transform ${
                                  item.cotizador
                                    ? "translate-x-[18px]"
                                    : "translate-x-[3px]"
                                }`}
                              />
                            </button>
                            <Button
                              variant="ghost"
                              size="xs"
                              className={`h-7.5 w-8 rounded-lg border-none p-1.5 shadow-xs ${
                                item.oculto
                                  ? "text-icon-error hover:text-red-600"
                                  : "text-icon-secondary hover:text-green-600"
                              }`}
                              onPress={() => handleToggleOculto(item)}
                              aria-label={item.oculto ? "Mostrar en catálogo" : "Ocultar del catálogo"}
                            >
                              {item.oculto ? <EyeOffIcon /> : <EyeOnIcon />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-7.5 w-8 rounded-lg border-none p-1.5 text-icon-secondary shadow-xs"
                            >
                              <MenuDotsIcon />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </TableRoot>
            )}
          </div>
        </Card>
      </div>

      {/* ── Agregar Producto Modal ─────────────────────────── */}
      <Dialog isOpen={addModalOpen} onOpenChange={setAddModalOpen} className="max-w-5xl">
        {({ close }) => (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                  <span className="material-symbols-outlined">add_box</span>
                </div>
                <div>
                  <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                  <p className="mt-1 text-sm text-text-tertiary">Registro en sistema ERP</p>
                </div>
              </div>
            </DialogHeader>

            <DialogBody className="max-h-[80vh] overflow-y-auto">
              {/* ── Mode Toggle ── */}
              <div className="mb-4 inline-flex rounded-lg border border-card-border bg-background-gray-secondary p-0.5">
                <button
                  type="button"
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    addMode === "manual"
                      ? "bg-background-white-primary text-text-primary shadow-sm"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                  onClick={() => { setAddMode("manual"); resetCsv(); }}
                >
                  Ingreso Manual
                </button>
                <button
                  type="button"
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    addMode === "csv"
                      ? "bg-background-white-primary text-text-primary shadow-sm"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                  onClick={() => { setAddMode("csv"); resetCsv(); }}
                >
                  Importar CSV
                </button>
              </div>

              {/* ── Manual Mode ── */}
              {addMode === "manual" && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* ── Left: Información Básica ── */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Información Básica
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">
                        Categoría <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                        value={addCategory}
                        onChange={(e) => {
                          setAddCategory(e.target.value);
                          setAddForm({});
                        }}
                      >
                        {ADD_PRODUCT_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">Subcategoría</label>
                      <select
                        className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary disabled:cursor-not-allowed disabled:text-text-tertiary"
                        value={addForm.subcategoria || ""}
                        disabled={getSubcategorias(addCategory).length === 0}
                        onChange={(e) => setAddForm((f) => ({ ...f, subcategoria: e.target.value }))}
                      >
                        <option value="">Seleccionar...</option>
                        {getSubcategorias(addCategory).map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">
                        Nombre del Producto <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. AMD Ryzen 7 7800X3D"
                        className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                        value={addForm.nombre || ""}
                        onChange={(e) => setAddForm((f) => ({ ...f, nombre: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">
                        Marca <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="AMD, Intel, ASUS..."
                        className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                        value={addForm.marca || ""}
                        onChange={(e) => setAddForm((f) => ({ ...f, marca: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-text-primary">Moneda</label>
                        <select
                          className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                          value={addForm.moneda || "USD"}
                          onChange={(e) => setAddForm((f) => ({ ...f, moneda: e.target.value }))}
                        >
                          <option value="USD">USD ($)</option>
                          <option value="PEN">PEN (S/.)</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-text-primary">Precio</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                          value={addForm.precio || ""}
                          onChange={(e) => setAddForm((f) => ({ ...f, precio: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-text-primary">Stock</label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                          value={addForm.stock || ""}
                          onChange={(e) => setAddForm((f) => ({ ...f, stock: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">Imagen del Producto</label>
                      <ImageUploader
                        value={addForm.imagenUrl || ""}
                        onChange={(url) => setAddForm((f) => ({ ...f, imagenUrl: url }))}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Right: Atributos Técnicos ── */}
                <div className="space-y-4 rounded-xl bg-background-gray-secondary p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Atributos Técnicos — {ADD_PRODUCT_CATEGORIES.find((c) => c.value === addCategory)?.label}
                  </h3>

                  <div className="space-y-4">
                    {/* ── CPU ── */}
                    {addCategory === "cpu" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Socket</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.socket || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, socket: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {SOCKET_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Tipo Memoria</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.tipoMemoria || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, tipoMemoria: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {TIPO_MEMORIA_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">TDP (Watts)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.tdp || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, tdp: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {CPU_TDP_OPTIONS.map((w) => (
                                <option key={w} value={w}>{w}W</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col justify-center gap-2 pt-5">
                            <label className="flex items-center gap-2 text-sm text-text-primary">
                              <input
                                type="checkbox"
                                className="size-4 rounded"
                                checked={addForm.requiereCooler === "true"}
                                onChange={(e) =>
                                  setAddForm((f) => ({ ...f, requiereCooler: e.target.checked ? "true" : "false" }))
                                }
                              />
                              Requiere Cooler
                            </label>
                            <label className="flex items-center gap-2 text-sm text-text-primary">
                              <input
                                type="checkbox"
                                className="size-4 rounded"
                                checked={addForm.tieneGraficosIntegrados === "true"}
                                onChange={(e) =>
                                  setAddForm((f) => ({
                                    ...f,
                                    tieneGraficosIntegrados: e.target.checked ? "true" : "false",
                                  }))
                                }
                              />
                              Gráficos Integrados
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Motherboard ── */}
                    {addCategory === "motherboard" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Socket</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.socket || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, socket: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {SOCKET_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Tipo Memoria</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.tipoMemoria || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, tipoMemoria: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {TIPO_MEMORIA_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Factor Forma</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.factorForma || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, factorForma: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {FACTOR_FORMA_OPTIONS.map((f) => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">RAM Slots</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.ramSlots || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, ramSlots: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {RAM_SLOTS_OPTIONS.map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Max Memoria RAM (GB)</label>
                          <select
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary md:w-1/2"
                            value={addForm.maxMemoriaGB || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, maxMemoriaGB: e.target.value }))}
                          >
                            <option value="">Seleccionar...</option>
                            {MAX_MEMORIA_OPTIONS.map((g) => (
                              <option key={g} value={g}>{g} GB</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* ── RAM ── */}
                    {addCategory === "ram" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Tipo Memoria</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.tipoMemoria || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, tipoMemoria: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {TIPO_MEMORIA_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Factor Forma</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.factorForma || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, factorForma: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              <option value="DIMM">DIMM</option>
                              <option value="SODIMM">SODIMM</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Capacidad (GB)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.capacidadGB || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, capacidadGB: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {RAM_CAPACIDAD_OPTIONS.map((c) => (
                                <option key={c} value={c}>{c} GB</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Frecuencia (MHz)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.frecuenciaMHz || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, frecuenciaMHz: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {RAM_FRECUENCIA_OPTIONS.map((f) => (
                                <option key={f} value={f}>{f} MHz</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── GPU ── */}
                    {addCategory === "gpu" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">VRAM (GB)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.vramGB || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, vramGB: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {VRAM_OPTIONS.map((v) => (
                                <option key={v} value={v}>{v} GB</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">PSU Rec. (Watts)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.consumoRecomendadoFuenteWatts || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, consumoRecomendadoFuenteWatts: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {GPU_PSU_REC_OPTIONS.map((w) => (
                                <option key={w} value={w}>{w}W</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Largo (mm)</label>
                          <select
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary md:w-1/2"
                            value={addForm.largoMm || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, largoMm: e.target.value }))}
                          >
                            <option value="">Seleccionar...</option>
                            {GPU_LARGO_OPTIONS.map((l) => (
                              <option key={l} value={l}>{l} mm</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* ── Cooler ── */}
                    {addCategory === "cooler" && (
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">
                            Sockets Soportados
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {SOCKET_OPTIONS.map((s) => {
                              const selected = formValueToArray(addForm.socketsSoportados).includes(s);
                              return (
                                <label
                                  key={s}
                                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                    selected
                                      ? "border-brand-500 bg-brand-500/10 text-brand-600"
                                      : "border-card-border bg-background-white-primary text-text-secondary hover:border-brand-300"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={selected}
                                    onChange={() => {
                                      const current = formValueToArray(addForm.socketsSoportados);
                                      setAddForm((f) => ({
                                        ...f,
                                        socketsSoportados: toggleArrayValue(current, s).join(", "),
                                      }));
                                    }}
                                  />
                                  {s}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">TDP Soportado (W)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.tdpSoportadoWatts || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, tdpSoportadoWatts: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {COOLER_TDP_OPTIONS.map((w) => (
                                <option key={w} value={w}>{w}W</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Tipo</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.tipoRefrigeracion || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, tipoRefrigeracion: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {TIPO_REFRIGERACION_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">N° Ventiladores</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.numeroVentiladores || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, numeroVentiladores: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {COOLER_VENTILADORES_OPTIONS.map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Case ── */}
                    {addCategory === "case" && (
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">
                            Factores de Forma Soportados
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {FACTOR_FORMA_OPTIONS.map((ff) => {
                              const selected = formValueToArray(addForm.soportaFactoresForma).includes(ff);
                              return (
                                <label
                                  key={ff}
                                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                    selected
                                      ? "border-brand-500 bg-brand-500/10 text-brand-600"
                                      : "border-card-border bg-background-white-primary text-text-secondary hover:border-brand-300"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={selected}
                                    onChange={() => {
                                      const current = formValueToArray(addForm.soportaFactoresForma);
                                      setAddForm((f) => ({
                                        ...f,
                                        soportaFactoresForma: toggleArrayValue(current, ff).join(", "),
                                      }));
                                    }}
                                  />
                                  {ff}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">GPU Máx (mm)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.largoMaxGpuMm || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, largoMaxGpuMm: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {CASE_GPU_MAX_OPTIONS.map((l) => (
                                <option key={l} value={l}>{l} mm</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Max Fans / Radiador</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.soportaFanCoolerVentiladores || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, soportaFanCoolerVentiladores: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {CASE_FAN_SLOTS_OPTIONS.map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 text-sm text-text-primary">
                            <input
                              type="checkbox"
                              className="size-4 rounded"
                              checked={addForm.tieneFuentePoder === "true"}
                              onChange={(e) =>
                                setAddForm((f) => ({ ...f, tieneFuentePoder: e.target.checked ? "true" : "false" }))
                              }
                            />
                            Incluye Fuente de Poder
                          </label>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Potencia Fuente (W)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.potenciaFuenteWatts || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, potenciaFuenteWatts: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {CASE_FUENTE_POTENCIA_OPTIONS.map((w) => (
                                <option key={w} value={w}>{w}W</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── PSU ── */}
                    {addCategory === "psu" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Potencia (W)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.potenciaWatts || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, potenciaWatts: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {PSU_POTENCIA_OPTIONS.map((w) => (
                                <option key={w} value={w}>{w}W</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Certificación 80+</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.certificacion80Plus || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, certificacion80Plus: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {CERTIFICACION_80PLUS_OPTIONS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Factor Forma</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.factorForma || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, factorForma: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {PSU_FACTOR_FORMA_OPTIONS.map((f) => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                          <label className="flex items-center gap-2 pt-6 text-sm text-text-primary">
                            <input
                              type="checkbox"
                              className="size-4 rounded"
                              checked={addForm.esModular === "true"}
                              onChange={(e) =>
                                setAddForm((f) => ({ ...f, esModular: e.target.checked ? "true" : "false" }))
                              }
                            />
                            Modular
                          </label>
                        </div>
                      </div>
                    )}

                    {/* ── SSD ── */}
                    {addCategory === "ssd" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Capacidad (GB)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.capacidadGB || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, capacidadGB: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {SSD_CAPACIDAD_OPTIONS.map((c) => (
                                <option key={c} value={c}>{c} GB</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Formato</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.formato || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, formato: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {SSD_FORMATO_OPTIONS.map((f) => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Interfaz</label>
                          <select
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary md:w-1/2"
                            value={addForm.interfaz || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, interfaz: e.target.value }))}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="SATA">SATA</option>
                            <option value="NVMe">NVMe</option>
                            <option value="PCIe">PCIe</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Lectura (MB/s)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.lecturaMBs || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, lecturaMBs: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {SSD_LECTURA_OPTIONS.map((v) => (
                                <option key={v} value={v}>{v} MB/s</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Escritura (MB/s)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.escrituraMBs || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, escrituraMBs: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {SSD_ESCRITURA_OPTIONS.map((v) => (
                                <option key={v} value={v}>{v} MB/s</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Monitor ── */}
                    {addCategory === "monitor" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Tamaño</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.tamano || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, tamano: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {MONITOR_TAMANO_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Resolución</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.resolucion || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, resolucion: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {MONITOR_RESOLUCION_OPTIONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Tipo Panel</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.tipoPanel || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, tipoPanel: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {MONITOR_PANEL_OPTIONS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Relación de Aspecto</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.ratioAspecto || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, ratioAspecto: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {MONITOR_RATIO_OPTIONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Tiempo Respuesta (ms)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.tiempoRespuestaMs || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, tiempoRespuestaMs: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {MONITOR_RESPUESTA_OPTIONS.map((v) => (
                                <option key={v} value={v}>{v} ms</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Tasa de Refresco (Hz)</label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                              value={addForm.tasaRefrescoHz || ""}
                              onChange={(e) => setAddForm((f) => ({ ...f, tasaRefrescoHz: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {MONITOR_REFRESCO_OPTIONS.map((hz) => (
                                <option key={hz} value={hz}>{hz} Hz</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Puertos</label>
                          <div className="flex flex-wrap gap-2">
                            {MONITOR_PUERTOS_OPTIONS.map((p) => {
                              const selected = formValueToArray(addForm.puertos).includes(p);
                              return (
                                <label
                                  key={p}
                                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                    selected
                                      ? "border-brand-500 bg-brand-500/10 text-brand-600"
                                      : "border-card-border bg-background-white-primary text-text-secondary hover:border-brand-300"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={selected}
                                    onChange={() => {
                                      const current = formValueToArray(addForm.puertos);
                                      setAddForm((f) => ({
                                        ...f,
                                        puertos: toggleArrayValue(current, p).join(", "),
                                      }));
                                    }}
                                  />
                                  {p}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* ── CSV Mode ── */}
              {addMode === "csv" && (
                <div className="space-y-4">
                  <input
                    ref={csvFileRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvFileChange}
                  />

                  {/* Select step */}
                  {csvStep === "select" && (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-background-gray-secondary">
                        <span className="material-symbols-outlined text-3xl text-icon-tertiary">upload_file</span>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-text-primary">Selecciona un archivo CSV para importar</p>
                        <p className="mt-1 text-xs text-text-tertiary">Formato: el mismo que genera "Descargar CSV"</p>
                      </div>
                      <Button appearance="outline" onPress={() => csvFileRef.current?.click()}>
                        <span className="material-symbols-outlined text-base">folder_open</span>
                        Seleccionar archivo
                      </Button>
                    </div>
                  )}

                  {/* Preview step */}
                  {csvStep === "preview" && csvParseResult && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-background-gray-secondary p-3 text-center">
                          <p className="text-2xl font-semibold text-text-primary">{csvParseResult.valid.length}</p>
                          <p className="text-xs text-text-tertiary">Productos válidos</p>
                        </div>
                        <div className="rounded-lg bg-background-gray-secondary p-3 text-center">
                          <p className={`text-2xl font-semibold ${csvParseResult.errors.length > 0 ? "text-red-500" : "text-text-primary"}`}>{csvParseResult.errors.length}</p>
                          <p className="text-xs text-text-tertiary">Errores</p>
                        </div>
                        <div className="rounded-lg bg-background-gray-secondary p-3 text-center">
                          <p className="text-2xl font-semibold text-text-primary">{Object.keys(groupByCategory(csvParseResult.valid)).length}</p>
                          <p className="text-xs text-text-tertiary">Categorías</p>
                        </div>
                      </div>

                      {csvParseResult.errors.length > 0 && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="mb-2 text-xs font-semibold text-red-700">Errores (se saltarán al importar):</p>
                          <div className="max-h-32 space-y-1 overflow-y-auto">
                            {csvParseResult.errors.map((err, i) => (
                              <p key={i} className="text-xs text-red-600">Fila {err.row}: {err.message}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="overflow-x-auto rounded-lg border border-card-border">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-card-border bg-background-gray-secondary">
                              <th className="px-3 py-2 text-left font-medium text-text-tertiary">Fila</th>
                              <th className="px-3 py-2 text-left font-medium text-text-tertiary">Nombre</th>
                              <th className="px-3 py-2 text-left font-medium text-text-tertiary">Marca</th>
                              <th className="px-3 py-2 text-left font-medium text-text-tertiary">Categoría</th>
                              <th className="px-3 py-2 text-left font-medium text-text-tertiary">Precio</th>
                              <th className="px-3 py-2 text-left font-medium text-text-tertiary">Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvParseResult.valid.slice(0, 20).map((row, i) => (
                              <tr key={i} className="border-b border-card-border last:border-b-0">
                                <td className="px-3 py-2 text-text-tertiary">{i + 2}</td>
                                <td className="px-3 py-2 font-medium text-text-primary">{row.form.nombre}</td>
                                <td className="px-3 py-2 text-text-secondary">{row.form.marca}</td>
                                <td className="px-3 py-2">
                                  <span className="inline-block rounded bg-brand-500/10 px-2 py-0.5 text-brand-600">{row.categoryKey}</span>
                                </td>
                                <td className="px-3 py-2 text-text-secondary">{row.form.precio || "—"}</td>
                                <td className="px-3 py-2 text-text-secondary">{row.form.stock || "0"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {csvParseResult.valid.length > 20 && (
                          <p className="px-3 py-2 text-center text-xs text-text-tertiary">
                            Mostrando 20 de {csvParseResult.valid.length} productos
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Importing step */}
                  {csvStep === "importing" && (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <div className="size-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                      <p className="text-sm text-text-secondary">
                        Importando {csvProgress.current} de {csvProgress.total}...
                      </p>
                      <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-background-gray-secondary">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-300"
                          style={{ width: `${csvProgress.total ? (csvProgress.current / csvProgress.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Done step */}
                  {csvStep === "done" && csvResult && (
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-green-50 p-4 text-center">
                          <span className="material-symbols-outlined text-3xl text-green-600">check_circle</span>
                          <p className="mt-1 text-2xl font-semibold text-green-700">{csvResult.created}</p>
                          <p className="text-xs text-green-600">Creados</p>
                        </div>
                        <div className={`rounded-lg p-4 text-center ${csvResult.failed > 0 ? "bg-red-50" : "bg-background-gray-secondary"}`}>
                          <span className={`material-symbols-outlined text-3xl ${csvResult.failed > 0 ? "text-red-500" : "text-icon-tertiary"}`}>
                            {csvResult.failed > 0 ? "error" : "check_circle"}
                          </span>
                          <p className={`mt-1 text-2xl font-semibold ${csvResult.failed > 0 ? "text-red-600" : "text-text-primary"}`}>{csvResult.failed}</p>
                          <p className={`text-xs ${csvResult.failed > 0 ? "text-red-500" : "text-text-tertiary"}`}>Fallidos</p>
                        </div>
                      </div>
                      {csvResult.failDetails.length > 0 && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="mb-2 text-xs font-semibold text-red-700">Detalles de errores:</p>
                          <div className="max-h-32 space-y-1 overflow-y-auto">
                            {csvResult.failDetails.map((err, i) => (
                              <p key={i} className="text-xs text-red-600">Fila {err.row} ({err.name}): {err.error}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </DialogBody>

            <DialogFooter>
              <DialogClose appearance="outline" onPress={() => { resetCsv(); setAddMode("manual"); close(); }}>
                Cancelar
              </DialogClose>
              {addMode === "manual" && (
                <Button onClick={handleAddProduct} isDisabled={submitting}>
                  <span className="material-symbols-outlined text-base">save</span>
                  {submitting ? "Guardando..." : "Guardar Producto"}
                </Button>
              )}
              {addMode === "csv" && csvStep === "preview" && csvParseResult && (
                <Button onPress={handleCsvImport} isDisabled={csvParseResult.valid.length === 0}>
                  <span className="material-symbols-outlined text-base">upload</span>
                  Importar {csvParseResult.valid.length} productos
                </Button>
              )}
              {addMode === "csv" && csvStep === "done" && (
                <Button onPress={() => { resetCsv(); setAddMode("manual"); close(); }}>Cerrar</Button>
              )}
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
