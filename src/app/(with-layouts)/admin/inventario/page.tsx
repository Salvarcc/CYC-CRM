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
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/common/image-uploader/image-uploader";
import { EyeOffIcon, EyeOnIcon, FilterIcon, MinusIcon, PlusIcon, RefreshIcon } from "./icons";
import { getSubcategorias } from "./subcategorias";

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
] as const;

const CATEGORY_KEY_MAP: Record<string, string> = {
  Procesadores: "cpu",
  "Placas Madre": "motherboard",
  "Memoria RAM": "ram",
  "Tarjetas de Video": "gpu",
  Refrigeración: "cooler",
  Gabinetes: "case",
  "Fuentes de Poder": "psu",
};

const ADD_PRODUCT_CATEGORIES = [
  { value: "cpu", label: "Procesadores" },
  { value: "motherboard", label: "Placas Madre" },
  { value: "ram", label: "Memoria RAM" },
  { value: "gpu", label: "Tarjetas de Video" },
  { value: "cooler", label: "Refrigeración" },
  { value: "case", label: "Gabinetes" },
  { value: "psu", label: "Fuentes de Poder" },
];

const PLACEHOLDER_IMG = "https://placehold.co/40x40/f3f4f6/6b7280?text=PC";

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

  const totalProducts = items.length;
  const inStock = items.filter((i) => i.stock > 0).length;
  const lowStock = items.filter((i) => i.stock > 0 && i.stock <= 5).length;
  const outOfStock = items.filter((i) => i.stock === 0).length;
  const ocultos = items.filter((i) => i.oculto).length;

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

          {/* Table */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <span className="text-sm text-text-tertiary">Cargando productos...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <span className="material-symbols-outlined text-4xl text-text-tertiary">
                  inventory_2
                </span>
                <p className="text-sm text-text-tertiary">
                  No hay productos en esta categoría.
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
                  {items.map((item) => {
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

            <DialogBody className="max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Column 1: Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Información Básica
                  </h3>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">
                      Nombre del Producto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. AMD Ryzen 7 7800X3D"
                      className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                      value={addForm.nombre || ""}
                      onChange={(e) => setAddForm((f) => ({ ...f, nombre: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">
                        Categoría <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
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
                      <label className="mb-1 block text-sm font-medium text-text-primary">
                        Marca <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="AMD, Intel, ASUS..."
                        className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                        value={addForm.marca || ""}
                        onChange={(e) => setAddForm((f) => ({ ...f, marca: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">
                      Subcategoría
                    </label>
                    <select
                      className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary disabled:cursor-not-allowed disabled:text-text-tertiary"
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

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="mb-1 block text-sm font-medium text-text-primary">
                        Moneda
                      </label>
                      <select
                        className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                        value={addForm.moneda || "USD"}
                        onChange={(e) => setAddForm((f) => ({ ...f, moneda: e.target.value }))}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="PEN">PEN (S/.)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-sm font-medium text-text-primary">
                        Precio
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                        value={addForm.precio || ""}
                        onChange={(e) => setAddForm((f) => ({ ...f, precio: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                      value={addForm.stock || ""}
                      onChange={(e) => setAddForm((f) => ({ ...f, stock: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">
                      Imagen del Producto
                    </label>
                    <ImageUploader
                      value={addForm.imagenUrl || ""}
                      onChange={(url) => setAddForm((f) => ({ ...f, imagenUrl: url }))}
                    />
                  </div>
                </div>

                {/* Column 2: Hardware Attributes */}
                <div className="space-y-4 rounded-lg border border-card-border bg-background-gray-secondary p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Atributos Técnicos
                  </h3>

                  {/* CPU */}
                  {addCategory === "cpu" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Socket</label>
                          <input
                            type="text"
                            placeholder="AM5, LGA1700..."
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.socket || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, socket: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Tipo Memoria</label>
                          <select
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.tipoMemoria || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, tipoMemoria: e.target.value }))}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="DDR4">DDR4</option>
                            <option value="DDR5">DDR5</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">TDP (Watts)</label>
                          <input
                            type="number"
                            placeholder="120"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.tdp || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, tdp: e.target.value }))}
                          />
                        </div>
                        <div className="flex items-end gap-4">
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
                    </>
                  )}

                  {/* Motherboard */}
                  {addCategory === "motherboard" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Socket</label>
                          <input
                            type="text"
                            placeholder="AM5, LGA1700..."
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.socket || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, socket: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Tipo Memoria</label>
                          <select
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.tipoMemoria || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, tipoMemoria: e.target.value }))}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="DDR4">DDR4</option>
                            <option value="DDR5">DDR5</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Factor Forma</label>
                          <select
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.factorForma || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, factorForma: e.target.value }))}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="ATX">ATX</option>
                            <option value="Micro-ATX">Micro-ATX</option>
                            <option value="Mini-ITX">Mini-ITX</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">RAM Slots</label>
                          <input
                            type="number"
                            placeholder="4"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.ramSlots || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, ramSlots: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Max RAM (GB)</label>
                          <input
                            type="number"
                            placeholder="128"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.maxMemoriaGB || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, maxMemoriaGB: e.target.value }))}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* RAM */}
                  {addCategory === "ram" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Tipo Memoria</label>
                          <select
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.tipoMemoria || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, tipoMemoria: e.target.value }))}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="DDR4">DDR4</option>
                            <option value="DDR5">DDR5</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Factor Forma</label>
                          <select
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.factorForma || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, factorForma: e.target.value }))}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="DIMM">DIMM</option>
                            <option value="SODIMM">SODIMM</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Capacidad (GB)</label>
                          <input
                            type="number"
                            placeholder="32"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.capacidadGB || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, capacidadGB: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Frecuencia (MHz)</label>
                          <input
                            type="number"
                            placeholder="6000"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.frecuenciaMHz || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, frecuenciaMHz: e.target.value }))}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* GPU */}
                  {addCategory === "gpu" && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">VRAM (GB)</label>
                          <input
                            type="number"
                            placeholder="12"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.vramGB || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, vramGB: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">PSU Rec. (W)</label>
                          <input
                            type="number"
                            placeholder="750"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.consumoRecomendadoFuenteWatts || ""}
                            onChange={(e) =>
                              setAddForm((f) => ({ ...f, consumoRecomendadoFuenteWatts: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Largo (mm)</label>
                          <input
                            type="number"
                            placeholder="300"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.largoMm || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, largoMm: e.target.value }))}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Cooler */}
                  {addCategory === "cooler" && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-text-primary">
                          Sockets Soportados (separados por coma)
                        </label>
                        <input
                          type="text"
                          placeholder="LGA1700, AM5, LGA1851"
                          className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                          value={addForm.socketsSoportados || ""}
                          onChange={(e) => setAddForm((f) => ({ ...f, socketsSoportados: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">TDP Soportado (W)</label>
                          <input
                            type="number"
                            placeholder="150"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.tdpSoportadoWatts || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, tdpSoportadoWatts: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Tipo</label>
                          <select
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.tipoRefrigeracion || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, tipoRefrigeracion: e.target.value }))}
                          >
                            <option value="Aire">Aire</option>
                            <option value="Líquida AIO">Líquida AIO</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">N° Ventiladores</label>
                          <input
                            type="number"
                            placeholder="2"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.numeroVentiladores || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, numeroVentiladores: e.target.value }))}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Case */}
                  {addCategory === "case" && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-text-primary">
                          Factores Forma Soportados (separados por coma)
                        </label>
                        <input
                          type="text"
                          placeholder="ATX, Micro-ATX, Mini-ITX"
                          className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                          value={addForm.soportaFactoresForma || ""}
                          onChange={(e) => setAddForm((f) => ({ ...f, soportaFactoresForma: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">GPU Max (mm)</label>
                          <input
                            type="number"
                            placeholder="360"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.largoMaxGpuMm || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, largoMaxGpuMm: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Max Fans / Radiador</label>
                          <input
                            type="number"
                            placeholder="3"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.soportaFanCoolerVentiladores || ""}
                            onChange={(e) =>
                              setAddForm((f) => ({ ...f, soportaFanCoolerVentiladores: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
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
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.potenciaFuenteWatts || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, potenciaFuenteWatts: e.target.value }))}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* PSU */}
                  {addCategory === "psu" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Potencia (W)</label>
                          <input
                            type="number"
                            placeholder="850"
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.potenciaWatts || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, potenciaWatts: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Certificación 80+</label>
                          <select
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.certificacion80Plus || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, certificacion80Plus: e.target.value }))}
                          >
                            <option value="Bronze">Bronze</option>
                            <option value="Gold">Gold</option>
                            <option value="Platinum">Platinum</option>
                            <option value="Titanium">Titanium</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center gap-2 text-sm text-text-primary">
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
                        <div>
                          <label className="mb-1 block text-sm font-medium text-text-primary">Factor Forma</label>
                          <select
                            className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2 text-sm text-text-primary"
                            value={addForm.factorForma || ""}
                            onChange={(e) => setAddForm((f) => ({ ...f, factorForma: e.target.value }))}
                          >
                            <option value="ATX">ATX</option>
                            <option value="SFX">SFX</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <DialogClose appearance="outline" onPress={close}>
                Cancelar
              </DialogClose>
              <Button onClick={handleAddProduct} isDisabled={submitting}>
                <span className="material-symbols-outlined text-base">save</span>
                {submitting ? "Guardando..." : "Guardar Producto"}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
