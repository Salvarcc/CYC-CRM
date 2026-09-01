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
  "Almacenamiento SSD",
  "Monitores",
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
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const clearFilters = () => {
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    setMaxPrice(5000);
    setPage(1);
  };

  const activeFilterCount =
    selectedCategories.size + selectedBrands.size + (maxPrice < 5000 ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

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

  const priceMaxLabel =
    currency === "USD"
      ? `$${maxPrice.toLocaleString("en-US")}`
      : `S/${(maxPrice * 3.75).toLocaleString("es-PE")}`;

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-8 lg:px-8">
      {/* ── Filters panel ──
          Fixed sidebar on desktop (lg+); collapsible panel on mobile/tablet
          toggled via the "Filtros" button. Contains Categoría + Marca + clear. */}
      <aside
        className={`w-full flex-shrink-0 lg:block lg:w-64 ${
          filtersOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="rounded-xl p-4 shadow-sm"
          style={{
            backgroundColor: "var(--store-surface-container-lowest)",
            border: "1px solid var(--store-outline-variant)",
          }}
        >
          <div className="mb-2 flex items-center justify-between lg:hidden">
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--store-on-surface)" }}
            >
              Filtros
            </h3>
            <button
              aria-label="Cerrar filtros"
              onClick={() => setFiltersOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <h3
            className="mb-4 hidden text-xl font-semibold lg:block"
            style={{ color: "var(--store-on-surface)" }}
          >
            Filtros
          </h3>

          {/* Category */}
          <div
            className="border-b py-3"
            style={{ borderColor: "var(--store-outline-variant)" }}
          >
            <h4
              className="text-left text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--store-on-surface)" }}
            >
              Categoría
            </h4>
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

          {/* Brand */}
          <div className="pt-3">
            <h4
              className="text-left text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--store-on-surface)" }}
            >
              Marca
            </h4>
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

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border py-2 text-sm font-semibold transition-colors"
              style={{
                borderColor: "var(--store-outline-variant)",
                color: "var(--store-on-surface)",
              }}
            >
              <span className="material-symbols-outlined text-base">
                filter_alt_off
              </span>
              Limpiar filtros
            </button>
          )}
        </div>

        {/* CTA — below the filters, on the left sidebar */}
        <div
          className="mt-4 flex flex-col items-start gap-3 rounded-xl p-4 shadow-sm"
          style={{
            backgroundColor: "var(--store-surface-container-lowest)",
            border: "1px solid var(--store-outline-variant)",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ color: "var(--store-primary)", fontSize: "28px" }}
          >
            build
          </span>
          <h4
            className="text-base font-semibold"
            style={{ color: "var(--store-on-surface)" }}
          >
            ¿Te gustaría armar tu PC desde cero?
          </h4>
          <p
            className="text-sm"
            style={{ color: "var(--store-on-surface-variant)" }}
          >
            Usa nuestro configurador paso a paso con compatibilidad garantizada.
          </p>
          <a
            href="/configurador"
            className="w-full rounded-lg px-4 py-2 text-center text-sm font-semibold transition-all hover:scale-95"
            style={{
              backgroundColor: "var(--store-primary)",
              color: "var(--store-on-primary)",
            }}
          >
            Cotiza tu PC
          </a>
        </div>
      </aside>

      {/* ── Products Column ─────────────────────────────── */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1
            className="text-2xl font-bold sm:text-3xl"
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
          <div className="relative w-full md:max-w-md md:flex-1">
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

        {/* Mobile/tablet filter toggle + clear (below lg) */}
        <div className="mt-4 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              borderColor: "var(--store-outline-variant)",
              color: "var(--store-on-surface)",
              backgroundColor: "var(--store-surface-container-lowest)",
            }}
          >
            <span className="material-symbols-outlined text-lg">tune</span>
            Filtros
            {activeFilterCount > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: "var(--store-primary)",
                  color: "var(--store-on-primary)",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm font-semibold transition-colors hover:text-[var(--store-error)]"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Price slider — always visible on every device */}
        <div
          className="mt-4 rounded-xl p-4 shadow-sm"
          style={{
            backgroundColor: "var(--store-surface-container-lowest)",
            border: "1px solid var(--store-outline-variant)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--store-on-surface)" }}
            >
              Precio ({currency})
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: "var(--store-primary)" }}
            >
              {priceMaxLabel}
            </span>
          </div>
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
          <div className="mt-1 flex justify-between text-xs font-medium">
            <span style={{ color: "var(--store-on-surface-variant)" }}>$0</span>
            <span style={{ color: "var(--store-on-surface-variant)" }}>
              {currency === "USD"
                ? "$5000"
                : `S/${(5000 * 3.75).toLocaleString("es-PE")}`}
            </span>
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
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {paged.map((product) => {
                const tags = getTags(product);
                const isOutOfStock = product.stock === 0;
                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:border-[var(--store-outline)] hover:shadow-[0px_10px_15px_-3px_rgba(15,23,42,0.08)]"
                    style={{
                      backgroundColor: "var(--store-surface-container-lowest)",
                      borderColor: "var(--store-outline-variant)",
                    }}
                  >
                    {product.stock > 0 && product.stock <= 5 && (
                      <div
                        className="absolute left-2 top-2 z-10 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
                        style={{
                          backgroundColor: "var(--store-badge-amber-bg)",
                          color: "var(--store-badge-amber-fg)",
                        }}
                      >
                        Últimas unidades
                      </div>
                    )}

                    <div className="relative overflow-hidden bg-[var(--store-surface-container-low)] pt-[100%]">
                      <img
                        alt={product.nombre}
                        className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                        src={product.imagenUrl || PLACEHOLDER_IMG}
                      />
                    </div>

                    <div className="flex flex-1 flex-col p-3">
                      <div className="mb-2 flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                            style={{
                              backgroundColor: "var(--store-badge-blue-bg)",
                              color: "var(--store-badge-blue-fg)",
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
                      <div className="mt-auto flex flex-col pt-2">
                        <span
                          className="text-lg font-semibold"
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
                            categoryKey: product.categoryKey,
                          });
                          toast.success(`${product.nombre} agregado al carrito`);
                        }}
                        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
              <div className="mt-10 flex items-center justify-center gap-2">
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
