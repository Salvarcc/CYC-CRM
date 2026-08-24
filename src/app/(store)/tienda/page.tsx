"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useCurrency } from "@/hooks/use-currency";
import { displayPrice } from "@/utils/currency";
import { toast } from "sonner";

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
  attrs: Record<string, unknown>;
}

const CATEGORY_OPTIONS = [
  "Procesadores",
  "Tarjetas de Video",
  "Memoria RAM",
  "Placas Madre",
  "Refrigeración",
  "Gabinetes",
  "Fuentes de Poder",
];

const BRAND_OPTIONS = [
  "AMD",
  "Intel",
  "NVIDIA",
  "ASUS",
  "MSI",
  "Gigabyte",
  "EVGA",
  "Corsair",
  "Noctua",
  "BeQuiet",
  "Cooler Master",
  "Kingston",
  "G.Skill",
  "TeamGroup",
  "ZOTAC",
  "Sapphire",
  "XFX",
  "Thermaltake",
];

const PLACEHOLDER_IMG =
  "https://placehold.co/400x400/f3f4f6/6b7280?text=PC+Component";

function getTags(p: Product): string[] {
  const tags: string[] = [];
  if (p.category) tags.push(p.category);
  if (p.attrs?.tipoMemoria) tags.push(p.attrs.tipoMemoria as string);
  if (p.attrs?.vramGB) tags.push(`${p.attrs.vramGB}GB`);
  if (p.attrs?.capacidadGB) tags.push(`${p.attrs.capacidadGB}GB`);
  if (p.attrs?.socket) tags.push(p.attrs.socket as string);
  if (p.attrs?.factorForma) tags.push(p.attrs.factorForma as string);
  return tags.slice(0, 3);
}

export default function TiendaPage() {
  const { currency, rate } = useCurrency();
  const { addItem } = useCart();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("relevancia");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/products?inStock=true");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: Product[] = await res.json();
        setAllProducts(data);
      } catch {
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    setPage(1);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
    setPage(1);
  };

  const filtered = useMemo(() => {
    let list = allProducts;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.marca.toLowerCase().includes(q),
      );
    }

    if (selectedCategories.size > 0) {
      list = list.filter((p) => selectedCategories.has(p.category));
    }

    if (selectedBrands.size > 0) {
      list = list.filter((p) => selectedBrands.has(p.marca));
    }

    list = list.filter((p) => (p.precio ?? 0) <= maxPrice);

    switch (sortBy) {
      case "menor-precio":
        list = [...list].sort((a, b) => (a.precio ?? 0) - (b.precio ?? 0));
        break;
      case "mayor-precio":
        list = [...list].sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0));
        break;
      case "nombre":
        list = [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
    }

    return list;
  }, [allProducts, searchQuery, selectedCategories, selectedBrands, sortBy, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="mx-auto flex w-full flex-col gap-8 px-4 py-10 md:flex-row md:px-8">
      {/* ── Sidebar Filters ───────────────────────────────── */}
      <aside className="w-full flex-shrink-0 space-y-6 md:w-64">
        <div
          className="space-y-0 rounded-xl p-4 shadow-sm"
          style={{
            backgroundColor: "var(--store-surface-container-lowest)",
            border: "1px solid var(--store-outline-variant)",
          }}
        >
          <h3
            className="mb-4 text-xl font-semibold"
            style={{ color: "var(--store-on-surface)" }}
          >
            Filtros
          </h3>

          {/* Category */}
          <div
            className="border-b py-3"
            style={{ borderColor: "var(--store-outline-variant)" }}
          >
            <button
              className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--store-on-surface)" }}
            >
              Categoría
              <span className="material-symbols-outlined text-lg">expand_more</span>
            </button>
            <div className="mt-3 space-y-2 text-sm">
              {CATEGORY_OPTIONS.map((cat) => (
                <label
                  key={cat}
                  className="flex cursor-pointer items-center gap-2 group"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: "var(--store-primary)" }}
                  />
                  <span className="transition-colors group-hover:text-[var(--store-primary)]">
                    {cat}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price */}
          <div
            className="border-b py-3"
            style={{ borderColor: "var(--store-outline-variant)" }}
          >
            <button
              className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--store-on-surface)" }}
            >
              Precio ({currency})
              <span className="material-symbols-outlined text-lg">expand_more</span>
            </button>
            <div className="mt-4 px-1">
              <input
                type="range"
                min={0}
                max={5000}
                step={50}
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full cursor-pointer"
                style={{
                  ["--range-fill" as string]: `${(maxPrice / 5000) * 100}%`,
                }}
              />
              <div className="mt-2 flex justify-between text-xs font-medium">
                <span style={{ color: "var(--store-on-surface-variant)" }}>$0</span>
                <span style={{ color: "var(--store-on-surface-variant)" }}>
                  {currency === "USD" ? `$${maxPrice.toLocaleString("en-US")}` : `S/${(maxPrice * 3.75).toLocaleString("es-PE")}`}
                </span>
              </div>
            </div>
          </div>

          {/* Brand */}
          <div className="pt-3">
            <button
              className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--store-on-surface)" }}
            >
              Marca
              <span className="material-symbols-outlined text-lg">expand_more</span>
            </button>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
              {BRAND_OPTIONS.map((brand) => (
                <label
                  key={brand}
                  className="flex cursor-pointer items-center gap-2 group"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.has(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: "var(--store-primary)" }}
                  />
                  <span className="transition-colors group-hover:text-[var(--store-primary)]">
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Card */}
        <div
          className="flex flex-col items-center gap-4 rounded-xl p-6 text-center shadow-sm"
          style={{
            backgroundColor: "var(--store-surface-container-lowest)",
            border: "1px solid var(--store-outline-variant)",
          }}
        >
          <h4
            className="text-lg font-semibold"
            style={{ color: "var(--store-on-surface)" }}
          >
            ¿Te gustaría armar tu PC desde cero?
          </h4>
          <a
            href="/configurador"
            className="w-full rounded-lg px-6 py-2 text-sm font-semibold transition-all hover:scale-95"
            style={{
              backgroundColor: "var(--store-primary)",
              color: "var(--store-on-primary)",
            }}
          >
            Cotiza tu PC
          </a>
        </div>
      </aside>

      {/* ── Product Grid ──────────────────────────────────── */}
      <div className="flex-1">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--store-on-surface)" }}
          >
            {selectedCategories.size === 1
              ? [...selectedCategories][0]
              : "Catálogo de Productos"}
            <span
              className="ml-2 text-base font-normal"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              ({filtered.length} productos)
            </span>
          </h1>
          <div className="relative flex-1 md:max-w-md">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-full border py-2 pl-4 pr-10 text-sm transition-all focus:outline-none"
              style={{
                backgroundColor: "var(--store-surface-container-lowest)",
                borderColor: "var(--store-outline-variant)",
                color: "var(--store-on-surface)",
              }}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <span style={{ color: "var(--store-on-surface-variant)" }}>
              Ordenar por:
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="rounded-md border px-2 py-1 text-sm"
              style={{
                backgroundColor: "var(--store-surface-container-lowest)",
                borderColor: "var(--store-outline-variant)",
                color: "var(--store-on-surface)",
              }}
            >
              <option value="relevancia">Relevancia</option>
              <option value="menor-precio">Menor Precio</option>
              <option value="mayor-precio">Mayor Precio</option>
              <option value="nombre">Nombre</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="size-8 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: "var(--store-primary)" }} />
            <p className="text-sm" style={{ color: "var(--store-on-surface-variant)" }}>
              Cargando productos...
            </p>
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <span className="material-symbols-outlined text-5xl" style={{ color: "var(--store-on-surface-variant)" }}>
              search_off
            </span>
            <p className="text-sm" style={{ color: "var(--store-on-surface-variant)" }}>
              No se encontraron productos con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {paged.map((product) => {
                const tags = getTags(product);
                const isOutOfStock = product.stock === 0;
                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:border-[#cbd5e1] hover:shadow-[0px_10px_15px_-3px_rgba(15,23,42,0.08)]"
                    style={{
                      backgroundColor: "var(--store-surface-container-lowest)",
                      borderColor: "var(--store-outline-variant)",
                    }}
                  >
                    {product.stock > 0 && product.stock <= 5 && (
                      <div
                        className="absolute left-2 top-2 z-10 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
                        style={{
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                        }}
                      >
                        Últimas unidades
                      </div>
                    )}

                    <div className="relative overflow-hidden bg-[var(--store-surface-container-low)] pt-[100%]">
                      <img
                        alt={product.nombre}
                        className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                        src={product.imagenUrl || PLACEHOLDER_IMG}
                      />
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
                            style={{
                              backgroundColor: "#e0f2fe",
                              color: "#0284c7",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2
                        className="mb-1 line-clamp-2 text-sm font-semibold leading-tight"
                        style={{ color: "var(--store-on-surface)" }}
                      >
                        {product.nombre}
                      </h2>
                      <p
                        className="mb-2 text-xs"
                        style={{ color: "var(--store-on-surface-variant)" }}
                      >
                        {product.marca}
                      </p>
                      <div className="mt-auto pt-4 flex flex-col">
                        <span
                          className="text-xl font-semibold"
                          style={{ color: "var(--store-primary)" }}
                        >
                          {displayPrice(product.precio, product.moneda, currency, rate.venta)}
                        </span>
                      </div>
                      <button
                        disabled={isOutOfStock}
                        onClick={() => {
                          addItem({
                            id: product.id,
                            nombre: product.nombre,
                            marca: product.marca,
                            precio: product.precio ?? 0,
                            moneda: product.moneda,
                            imagenUrl: product.imagenUrl,
                            category: product.category,
                          });
                          toast.success(`${product.nombre} agregado al carrito`);
                        }}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          backgroundColor: isOutOfStock
                            ? "var(--store-outline-variant)"
                            : "var(--store-primary)",
                          color: isOutOfStock
                            ? "var(--store-on-surface-variant)"
                            : "var(--store-on-primary)",
                        }}
                      >
                        <span className="material-symbols-outlined text-base">
                          {isOutOfStock ? "block" : "add_shopping_cart"}
                        </span>
                        {isOutOfStock ? "Agotado" : "Agregar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors disabled:opacity-40"
                  style={{
                    borderColor: "var(--store-outline-variant)",
                    color: "var(--store-on-surface-variant)",
                  }}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors"
                    style={{
                      borderColor:
                        n === page
                          ? "var(--store-primary)"
                          : "var(--store-outline-variant)",
                      backgroundColor:
                        n === page ? "var(--store-primary)" : "transparent",
                      color:
                        n === page
                          ? "var(--store-on-primary)"
                          : "var(--store-on-surface)",
                    }}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors disabled:opacity-40"
                  style={{
                    borderColor: "var(--store-outline-variant)",
                    color: "var(--store-on-surface-variant)",
                  }}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
