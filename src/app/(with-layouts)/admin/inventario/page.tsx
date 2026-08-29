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
import CategoryAttributeForm from "./category-attribute-form";
import ProductDetailModal from "./product-detail-modal";

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

type AttrFilterType = "select" | "bool" | "gt" | "lt" | "contains";

interface AttrFilterDef {
  key: string;
  label: string;
  type?: AttrFilterType;
}

// Atributos técnicos por categoría para el minifiltro (bajo las pestañas de categoría).
const CATEGORY_ATTR_FILTERS: Record<string, AttrFilterDef[]> = {
  cpu: [
    { key: "socket", label: "Socket" },
    { key: "tipoMemoria", label: "Tipo Memoria" },
    { key: "tdp", label: "TDP mínimo (W)", type: "gt" },
    { key: "requiereCooler", label: "Requiere Cooler", type: "bool" },
    { key: "tieneGraficosIntegrados", label: "Gráficos Integrados", type: "bool" },
  ],
  motherboard: [
    { key: "socket", label: "Socket" },
    { key: "tipoMemoria", label: "Tipo Memoria" },
    { key: "factorForma", label: "Factor Forma" },
    { key: "ramSlots", label: "Mín. ranuras RAM", type: "gt" },
    { key: "maxMemoriaGB", label: "Mín. memoria máx (GB)", type: "gt" },
  ],
  ram: [
    { key: "tipoMemoria", label: "Tipo Memoria" },
    { key: "factorForma", label: "Factor Forma" },
    { key: "capacidadGB", label: "Capacidad (GB)", type: "select" },
    { key: "frecuenciaMHz", label: "Mín. frecuencia (MHz)", type: "gt" },
  ],
  gpu: [
    { key: "vramGB", label: "VRAM (GB)", type: "select" },
    { key: "consumoRecomendadoFuenteWatts", label: "Fuente rec. mín (W)", type: "gt" },
    { key: "largoMm", label: "Largo máx (mm)", type: "lt" },
  ],
  cooler: [
    { key: "tipoRefrigeracion", label: "Tipo Refrigeración" },
    { key: "tdpSoportadoWatts", label: "TDP soportado mín (W)", type: "gt" },
    { key: "numeroVentiladores", label: "Ventiladores", type: "select" },
  ],
  case: [
    { key: "soportaFactoresForma", label: "Factor Forma", type: "contains" },
    { key: "largoMaxGpuMm", label: "Largo máx GPU (mm)", type: "gt" },
    { key: "soportaFanCoolerVentiladores", label: "Mín. fans", type: "gt" },
    { key: "tieneFuentePoder", label: "Incluye Fuente", type: "bool" },
    { key: "potenciaFuenteWatts", label: "Potencia fuente (W)", type: "gt" },
  ],
  psu: [
    { key: "potenciaWatts", label: "Potencia mín (W)", type: "gt" },
    { key: "certificacion80Plus", label: "Certificación 80 Plus" },
    { key: "esModular", label: "Modular", type: "bool" },
    { key: "factorForma", label: "Factor Forma" },
  ],
  ssd: [
    { key: "capacidadGB", label: "Capacidad (GB)", type: "gt" },
    { key: "formato", label: "Formato" },
    { key: "interfaz", label: "Interfaz" },
  ],
  monitor: [
    { key: "tamano", label: "Tamaño" },
    { key: "resolucion", label: "Resolución" },
    { key: "tipoPanel", label: "Panel" },
    { key: "tasaRefrescoHz", label: "Refresco mín (Hz)", type: "gt" },
    { key: "tiempoRespuestaMs", label: "Respuesta máx (ms)", type: "lt" },
  ],
};

function isNumericAttrValue(v: unknown): v is number {
  return typeof v === "number";
}

function matchesAttrFilter(
  type: AttrFilterType,
  value: unknown,
  selected: string,
): boolean {
  if (!selected) return true;
  switch (type) {
    case "bool": {
      const expected = selected === "true";
      if (typeof value === "boolean") return value === expected;
      return String(value === true || value === "true") === selected;
    }
    case "gt": {
      const num = Number(selected);
      if (!Number.isFinite(num) || !isNumericAttrValue(value)) return true;
      return value >= num;
    }
    case "lt": {
      const num = Number(selected);
      if (!Number.isFinite(num) || !isNumericAttrValue(value)) return true;
      return value <= num;
    }
    case "contains": {
      if (Array.isArray(value)) return value.map(String).includes(selected);
      if (typeof value === "string") {
        return value
          .split(",")
          .map((s) => s.trim())
          .includes(selected);
      }
      return String(value ?? "") === selected;
    }
    case "select":
    default:
      return String(value ?? "") === selected;
  }
}

function buildAttrFilterOptions(activeCategory: string): AttrFilterDef[] {
  if (activeCategory !== "Todos") {
    const key = CATEGORY_KEY_MAP[activeCategory] ?? activeCategory;
    return CATEGORY_ATTR_FILTERS[key] ?? [];
  }
  const seen = new Map<string, { label: string; type: AttrFilterType }>();
  for (const [, filters] of Object.entries(CATEGORY_ATTR_FILTERS)) {
    for (const f of filters) {
      if (!seen.has(f.key)) seen.set(f.key, { label: f.label, type: f.type ?? "select" });
    }
  }
  return Array.from(seen, ([key, val]) => ({ key, label: val.label, type: val.type }));
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Product | null>(null);
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
  const [sortOption, setSortOption] = useState<string>("");

  const filteredItems = useMemo(() => {
    const activeAttrFilters = buildAttrFilterOptions(activeCategory);
    const result = items.filter((item) => {
      if (subcategoriaFilter) {
        const sub = (item.attrs.subcategoria as string) ?? "";
        if (sub !== subcategoriaFilter) return false;
      }
      for (const f of activeAttrFilters) {
        const value = (item.attrs as Record<string, unknown>)[f.key];
        const selected = attrFilters[f.key];
        if (!matchesAttrFilter(f.type ?? "select", value, selected)) return false;
      }
      return true;
    });

    if (!sortOption) return result;

    const sorted = [...result];
    switch (sortOption) {
      case "az":
        sorted.sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { sensitivity: "base" }));
        break;
      case "za":
        sorted.sort((a, b) => b.nombre.localeCompare(a.nombre, undefined, { sensitivity: "base" }));
        break;
      case "stock-asc":
        sorted.sort((a, b) => a.stock - b.stock);
        break;
      case "stock-desc":
        sorted.sort((a, b) => b.stock - a.stock);
        break;
      case "precio-asc":
        sorted.sort((a, b) => (a.precio ?? 0) - (b.precio ?? 0));
        break;
      case "precio-desc":
        sorted.sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0));
        break;
      default:
        break;
    }
    return sorted;
  }, [items, activeCategory, subcategoriaFilter, attrFilters, sortOption]);

  const resetMinifilters = useCallback(() => {
    setSubcategoriaFilter("");
    setAttrFilters({});
    setSortOption("");
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

  const handleSaveProduct = async (
    id: string,
    categoryKey: string,
    form: Record<string, string>,
  ) => {
    if (!detailItem) return;
    try {
      const payload = getAddPayload(categoryKey, form);
      const res = await fetch(`/api/${categoryKey}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          oculto: detailItem.oculto,
          cotizador: detailItem.cotizador,
        }),
      });
      if (!res.ok) throw new Error("Error al actualizar producto");
      toast.success("Producto actualizado correctamente");
      setDetailOpen(false);
      setDetailItem(null);
      fetchProducts();
    } catch {
      toast.error("No se pudo actualizar el producto");
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
                onClick={() => {
                  setActiveCategory(cat);
                  setSubcategoriaFilter("");
                  setAttrFilters({});
                }}
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

          {/* Minifiltro: en "Todos" solo ordenamiento; en categorías subcategoría + atributos técnicos */}
          {!loading && items.length > 0 && (() => {
            const attrDefs = buildAttrFilterOptions(activeCategory);
            const subcategorias = Array.from(
              new Set(
                items
                  .map((i) => (i.attrs.subcategoria as string) ?? "")
                  .filter(Boolean),
              ),
            ).sort();
            const hasActive = subcategoriaFilter || Object.keys(attrFilters).some((k) => attrFilters[k]) || !!sortOption;
            return (
              <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-card-border bg-background-gray-primary/40 p-3">
                {activeCategory === "Todos" ? (
                  <>
                    <div className="min-w-52 flex-1 sm:flex-none">
                      <label className="mb-1 block text-xs font-medium text-text-tertiary">
                        Ordenar por
                      </label>
                      <select
                        className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                      >
                        <option value="">Sin orden</option>
                        <option value="az">Nombre: A → Z</option>
                        <option value="za">Nombre: Z → A</option>
                        <option value="stock-desc">Stock: mayor a menor</option>
                        <option value="stock-asc">Stock: menor a mayor</option>
                        <option value="precio-desc">Precio: mayor a menor</option>
                        <option value="precio-asc">Precio: menor a mayor</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
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
                      const type = f.type ?? "select";
                      const current = attrFilters[f.key] ?? "";

                      if (type === "gt" || type === "lt") {
                        return (
                          <div key={f.key} className="min-w-36 flex-1 sm:flex-none">
                            <label className="mb-1 block text-xs font-medium text-text-tertiary">
                              {f.label}
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder={type === "gt" ? "≥ valor" : "≤ valor"}
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                              value={current}
                              onChange={(e) =>
                                setAttrFilters((prev) => ({
                                  ...prev,
                                  [f.key]: e.target.value,
                                }))
                              }
                            />
                          </div>
                        );
                      }

                      if (type === "bool") {
                        return (
                          <div key={f.key} className="min-w-36 flex-1 sm:flex-none">
                            <label className="mb-1 block text-xs font-medium text-text-tertiary">
                              {f.label}
                            </label>
                            <select
                              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                              value={current}
                              onChange={(e) =>
                                setAttrFilters((prev) => ({
                                  ...prev,
                                  [f.key]: e.target.value,
                                }))
                              }
                            >
                              <option value="">Todos</option>
                              <option value="true">Sí</option>
                              <option value="false">No</option>
                            </select>
                          </div>
                        );
                      }

                      const values = items.flatMap((i) => {
                        const v = (i.attrs as Record<string, unknown>)[f.key];
                        if (type === "contains") {
                          if (Array.isArray(v)) return v.map((x) => String(x));
                          if (typeof v === "string") return v.split(",").map((s) => s.trim());
                        }
                        return [String(v ?? "")];
                      }).filter(Boolean);
                      const options = Array.from(new Set(values)).sort();
                      if (options.length === 0) return null;
                      return (
                        <div key={f.key} className="min-w-36 flex-1 sm:flex-none">
                          <label className="mb-1 block text-xs font-medium text-text-tertiary">
                            {f.label}
                          </label>
                          <select
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={current}
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
                  </>
                )}
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
                      <div className="flex items-center justify-center">Cotizador</div>
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
                          <div className="flex items-center justify-center">
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
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
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
                              onPress={() => {
                                setDetailItem(item);
                                setDetailOpen(true);
                              }}
                              aria-label="Ver detalle del producto"
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

                  <CategoryAttributeForm categoryKey={addCategory} form={addForm} setForm={setAddForm} />
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

      <ProductDetailModal
        item={detailItem}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailItem(null);
        }}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
