"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/hooks/use-currency";
import { displayPrice, formatPrice, toPreferredCurrency } from "@/utils/currency";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  attrs: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Step definitions                                                   */
/* ------------------------------------------------------------------ */

const STEPS = [
  { key: "cpu", categoryKey: "cpu", label: "Procesador", icon: "memory" },
  { key: "motherboard", categoryKey: "motherboard", label: "Placa Madre", icon: "developer_board" },
  { key: "ram", categoryKey: "ram", label: "Memoria RAM", icon: "dns" },
  { key: "gpu", categoryKey: "gpu", label: "T. de Video", icon: "waves" },
  { key: "cooler", categoryKey: "cooler", label: "Refrigeración", icon: "ac_unit" },
  { key: "case", categoryKey: "case", label: "Gabinete", icon: "desktop_windows" },
  { key: "psu", categoryKey: "psu", label: "F. de Poder", icon: "power" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const STEP_KEYS: StepKey[] = STEPS.map((s) => s.key);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") return val.split(",").map((s) => s.trim());
  return [];
}

function toNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function toBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toLowerCase() === "true" || val === "1";
  return false;
}

const STEP_COLORS: Record<StepKey, string> = {
  cpu: "#b7131a",
  motherboard: "#00658d",
  ram: "#515c71",
  gpu: "#7c3aed",
  cooler: "#0ea5e9",
  case: "#d97706",
  psu: "#059669",
};

const CATEGORY_ICONS: Record<string, string> = {
  cpu: "memory",
  motherboard: "developer_board",
  ram: "dns",
  gpu: "waves",
  cooler: "ac_unit",
  case: "desktop_windows",
  psu: "power",
};

const PLACEHOLDER_IMG =
  "https://placehold.co/400x400/f3f4f6/6b7280?text=PC+Component";

const BRAND_OPTIONS: Record<StepKey, string[]> = {
  cpu: ["AMD", "Intel"],
  motherboard: ["ASUS", "MSI", "Gigabyte", "ASRock"],
  ram: ["Corsair", "G.Skill", "Kingston", "TeamGroup"],
  gpu: ["NVIDIA", "AMD", "ZOTAC", "EVGA", "ASUS", "MSI", "Gigabyte", "Sapphire", "XFX"],
  cooler: ["Noctua", "be quiet!", "Cooler Master", "Thermaltake", "Corsair", "DeepCool"],
  case: ["Lian Li", "NZXT", "Fractal Design", "Corsair", "Cooler Master", "Phanteks"],
  psu: ["Corsair", "EVGA", "Seasonic", "be quiet!", "Thermaltake", "Cooler Master"],
};

/* ------------------------------------------------------------------ */
/*  Build tags from product attrs                                      */
/* ------------------------------------------------------------------ */

function buildTags(p: Product): string[] {
  const a = p.attrs;
  switch (p.categoryKey) {
    case "cpu":
      return [
        a.socket as string,
        `${a.tdp}W`,
        a.tipoMemoria as string,
        toBool(a.tieneGraficosIntegrados) ? "Gráficos integrados" : null,
      ].filter(Boolean) as string[];
    case "motherboard":
      return [
        a.socket as string,
        a.tipoMemoria as string,
        a.factorForma as string,
        `${a.ramSlots} slots`,
        `${a.maxMemoriaGB}GB máx`,
      ].filter(Boolean) as string[];
    case "ram":
      return [
        a.tipoMemoria as string,
        `${a.capacidadGB}GB`,
        `${a.frecuenciaMHz}MHz`,
        a.factorForma as string,
      ].filter(Boolean) as string[];
    case "gpu":
      return [
        `${a.vramGB}GB VRAM`,
        `${a.largoMm}mm`,
        `${a.consumoRecomendadoFuenteWatts}W fuente`,
      ].filter(Boolean) as string[];
    case "cooler":
      return [
        a.tipoRefrigeracion as string,
        `${a.tdpSoportadoWatts}W TDP`,
        toStringArray(a.socketsSoportados).slice(0, 2).join(", "),
        `${a.numeroVentiladores} fans`,
      ].filter(Boolean) as string[];
    case "case": {
      const ff = toStringArray(a.soportaFactoresForma).join(", ");
      const extra = toBool(a.tieneFuentePoder)
        ? `Fuente: ${a.potenciaFuenteWatts}W`
        : null;
      return [
        ff,
        `${a.largoMaxGpuMm}mm GPU`,
        extra,
      ].filter(Boolean) as string[];
    }
    case "psu":
      return [
        `${a.potenciaWatts}W`,
        a.certificacion80Plus as string,
        toBool(a.esModular) ? "Modular" : null,
        a.factorForma as string,
      ].filter(Boolean) as string[];
    default:
      return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Fetch helper                                                       */
/* ------------------------------------------------------------------ */

async function fetchAllProducts(): Promise<Product[]> {
  try {
    const res = await fetch("/api/products?inStock=true");
    if (!res.ok) return [];
    const data: Product[] = await res.json();
    return data;
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ConfiguradorPage() {
  const router = useRouter();
  const { currency, rate } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<StepKey, Product | null>>({
    cpu: null,
    motherboard: null,
    ram: null,
    gpu: null,
    cooler: null,
    case: null,
    psu: null,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("Todas");
  const [sortOrder, setSortOrder] = useState("Relevancia");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchAllProducts();
      if (cancelled) return;

      /* Restore previous selections from localStorage */
      try {
        const raw = localStorage.getItem("cym-configuracion");
        if (raw) {
          const saved = JSON.parse(raw) as {
            selections: Record<string, Partial<Product>>;
          };
          const restored: Record<StepKey, Product | null> = {
            cpu: null,
            motherboard: null,
            ram: null,
            gpu: null,
            cooler: null,
            case: null,
            psu: null,
          };
          for (const key of STEP_KEYS) {
            const savedItem = saved.selections?.[key];
            if (savedItem?.id) {
              const fullProduct = data.find((p) => p.id === savedItem.id);
              if (fullProduct) restored[key] = fullProduct;
            }
          }
          setSelected(restored);

          /* Jump to first incomplete step */
          const firstIncomplete = STEP_KEYS.findIndex((k) => !restored[k]);
          setCurrentStep(firstIncomplete >= 0 ? firstIncomplete : STEP_KEYS.length - 1);
        }
      } catch {
        /* ignore corrupt data */
      }

      setProducts(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Auto-advance after selection ────────────────────────────── */

  const autoAdvanceRef = useRef(false);

  useEffect(() => {
    if (autoAdvanceRef.current) {
      autoAdvanceRef.current = false;
      if (currentStep < STEPS.length - 1) {
        goToStep(currentStep + 1);
      }
    }
  }, [selected, currentStep]);

  const stepDef = STEPS[currentStep];
  const stepKey = stepDef.key;

  const selectedCpu = selected.cpu;
  const selectedMotherboard = selected.motherboard;
  const selectedGpu = selected.gpu;
  const selectedCooler = selected.cooler;
  const selectedCase = selected.case;

  /* ── Compatibility filtering ─────────────────────────────────── */

  const compatibilityProducts = useMemo(() => {
    let list = products.filter((p) => p.categoryKey === stepDef.categoryKey);

    switch (stepKey) {
      case "cpu":
        list = list.filter((p) => p.stock > 0);
        break;

      case "motherboard":
        if (selectedCpu) {
          const cpuSocket = selectedCpu.attrs.socket as string;
          list = list.filter(
            (p) => p.stock > 0 && (p.attrs.socket as string) === cpuSocket,
          );
        }
        break;

      case "ram":
        if (selectedMotherboard) {
          const mbTypes = toStringArray(selectedMotherboard.attrs.tipoMemoria);
          list = list.filter(
            (p) =>
              p.stock > 0 &&
              mbTypes.includes(p.attrs.tipoMemoria as string),
          );
        }
        break;

      case "gpu":
        list = list.filter((p) => p.stock > 0);
        break;

      case "cooler":
        if (selectedCpu) {
          const cpuSocket = selectedCpu.attrs.socket as string;
          const cpuTdp = toNum(selectedCpu.attrs.tdp);
          list = list.filter(
            (p) =>
              p.stock > 0 &&
              toStringArray(p.attrs.socketsSoportados).includes(cpuSocket) &&
              toNum(p.attrs.tdpSoportadoWatts) >= cpuTdp,
          );
        }
        break;

      case "case": {
        if (selectedMotherboard) {
          const mbFF = selectedMotherboard.attrs.factorForma as string;
          list = list.filter((p) =>
            p.stock > 0 &&
            toStringArray(p.attrs.soportaFactoresForma).includes(mbFF),
          );
        }
        if (selectedGpu) {
          const gpuLargo = toNum(selectedGpu.attrs.largoMm);
          list = list.filter(
            (p) => toNum(p.attrs.largoMaxGpuMm) >= gpuLargo,
          );
        }
        if (selectedCooler) {
          const coolerFans = toNum(selectedCooler.attrs.numeroVentiladores);
          list = list.filter(
            (p) => toNum(p.attrs.soportaFanCoolerVentiladores) >= coolerFans,
          );
        }
        break;
      }

      case "psu": {
        const totalConsumption =
          toNum(selectedCpu?.attrs.tdp) +
          toNum(selectedGpu?.attrs.consumoRecomendadoFuenteWatts);
        list = list.filter(
          (p) =>
            p.stock > 0 &&
            toNum(p.attrs.potenciaWatts) >= totalConsumption,
        );
        break;
      }
    }

    return list;
  }, [products, stepKey, stepDef.categoryKey, selectedCpu, selectedMotherboard, selectedGpu, selectedCooler]);

  /* ── Search, brand, sort filtering ───────────────────────────── */

  const filteredProducts = useMemo(() => {
    let list = compatibilityProducts;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.marca.toLowerCase().includes(q),
      );
    }

    if (brandFilter !== "Todas") {
      list = list.filter(
        (p) => p.marca.toLowerCase() === brandFilter.toLowerCase(),
      );
    }

    switch (sortOrder) {
      case "Precio: Menor a Mayor":
        list = [...list].sort((a, b) => (a.precio ?? 0) - (b.precio ?? 0));
        break;
      case "Precio: Mayor a Menor":
        list = [...list].sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0));
        break;
      case "Nombre":
        list = [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
    }

    return list;
  }, [compatibilityProducts, search, brandFilter, sortOrder]);

  /* ── Step optionality ────────────────────────────────────────── */

  const isOptionalGpu =
    stepKey === "gpu" && toBool(selectedCpu?.attrs.tieneGraficosIntegrados);
  const isOptionalCooler =
    stepKey === "cooler" && !toBool(selectedCpu?.attrs.requiereCooler);
  const isOptionalPsu =
    stepKey === "psu" && toBool(selectedCase?.attrs.tieneFuentePoder);

  const isCurrentStepOptional = isOptionalGpu || isOptionalCooler || isOptionalPsu;

  /* ── Required step completion status ─────────────────────────── */

  const requiredCompleted = useMemo(() => {
    const cpuDone = !!selected.cpu;
    const mbDone = !!selected.motherboard;
    const ramDone = !!selected.ram;
    const gpuDone =
      toBool(selected.cpu?.attrs.tieneGraficosIntegrados) || !!selected.gpu;
    const coolerDone =
      !toBool(selected.cpu?.attrs.requiereCooler) || !!selected.cooler;
    const caseDone = !!selected.case;
    const psuDone =
      toBool(selected.case?.attrs.tieneFuentePoder) || !!selected.psu;
    return cpuDone && mbDone && ramDone && gpuDone && coolerDone && caseDone && psuDone;
  }, [selected]);

  /* ── Per-step completion check ──────────────────────────────── */

  function isStepCompleted(i: number): boolean {
    const key = STEP_KEYS[i];
    if (selected[key]) return true;
    switch (key) {
      case "gpu":
        return toBool(selected.cpu?.attrs.tieneGraficosIntegrados);
      case "cooler":
        return !toBool(selected.cpu?.attrs.requiereCooler);
      case "psu":
        return toBool(selected.case?.attrs.tieneFuentePoder);
      default:
        return false;
    }
  }

  /* ── Furthest step the user is allowed to reach ─────────────── */

  const furthestReachable = useMemo(() => {
    for (let i = 0; i < STEP_KEYS.length; i++) {
      if (!isStepCompleted(i)) return i;
    }
    return STEP_KEYS.length - 1;
  }, [selected]);

  /* ── Totals ──────────────────────────────────────────────────── */

  const totalPrice = useMemo(
    () =>
      STEP_KEYS.reduce(
        (sum, k) => sum + toPreferredCurrency(selected[k]?.precio ?? 0, selected[k]?.moneda ?? "USD", currency, rate.venta),
        0,
      ),
    [selected, currency, rate.venta],
  );

  const totalConsumption = useMemo(() => {
    const cpuW = toNum(selected.cpu?.attrs.tdp);
    const gpuW = toNum(selected.gpu?.attrs.consumoRecomendadoFuenteWatts);
    return cpuW + gpuW;
  }, [selected.cpu, selected.gpu]);

  const selectedCount = STEP_KEYS.filter((k) => !!selected[k]).length;

  /* ── Compatibility banner text ───────────────────────────────── */

  const bannerText = useMemo(() => {
    switch (stepKey) {
      case "cpu":
        return null;
      case "motherboard":
        return selectedCpu
          ? `Mostrando placas madre compatibles con socket ${(selectedCpu.attrs.socket as string) ?? ""}`
          : null;
      case "ram":
        return selectedMotherboard
          ? `Mostrando memorias compatibles con ${selectedMotherboard.attrs.tipoMemoria as string}`
          : null;
      case "gpu":
        return isOptionalGpu
          ? "Este paso es [Opcional] — tu procesador tiene gráficos integrados"
          : null;
      case "cooler":
        return selectedCpu
          ? isOptionalCooler
            ? "Este paso es [Opcional] — tu procesador incluye cooler de stock"
            : `Mostrando refrigeración compatible con ${(selectedCpu.attrs.socket as string) ?? ""} y TDP ≥ ${selectedCpu.attrs.tdp}W`
          : null;
      case "case": {
        const parts: string[] = [];
        if (selectedMotherboard)
          parts.push(`factor de forma ${selectedMotherboard.attrs.factorForma as string}`);
        if (selectedGpu)
          parts.push(`GPU ≤ ${selectedGpu.attrs.largoMm}mm`);
        if (selectedCooler)
          parts.push(`${selectedCooler.attrs.numeroVentiladores} ventiladores`);
        return parts.length ? `Mostrando gabinetes compatibles con ${parts.join(", ")}` : null;
      }
      case "psu": {
        if (isOptionalPsu)
          return `Este paso es [Opcional] — tu gabinete incluye una fuente de ${(selectedCase?.attrs.potenciaFuenteWatts as number) ?? 0}W`;
        return `Requiere fuente ≥ ${totalConsumption}W (CPU ${toNum(selected.cpu?.attrs.tdp)}W + GPU ${toNum(selected.gpu?.attrs.consumoRecomendadoFuenteWatts)}W)`;
      }
      default:
        return null;
    }
  }, [
    stepKey,
    selectedCpu,
    selectedMotherboard,
    selectedGpu,
    selectedCooler,
    selectedCase,
    isOptionalGpu,
    isOptionalCooler,
    isOptionalPsu,
    totalConsumption,
  ]);

  /* ── Handlers ────────────────────────────────────────────────── */

  function selectProduct(product: Product) {
    if (product.stock <= 0) return;
    autoAdvanceRef.current = true;
    setSelected((prev) => {
      const next = { ...prev, [stepKey]: product };
      /* Cascade invalidation: clear steps after current */
      const currentIdx = currentStep;
      for (let i = currentIdx + 1; i < STEP_KEYS.length; i++) {
        next[STEP_KEYS[i]] = null;
      }
      return next;
    });
  }

  function deselectCurrent() {
    setSelected((prev) => {
      const next = { ...prev, [stepKey]: null };
      const currentIdx = currentStep;
      for (let i = currentIdx + 1; i < STEP_KEYS.length; i++) {
        next[STEP_KEYS[i]] = null;
      }
      return next;
    });
  }

  function goToStep(i: number) {
    if (i > furthestReachable) return;
    setCurrentStep(i);
    setSearch("");
    setBrandFilter("Todas");
    setSortOrder("Relevancia");
  }

  function handleNext() {
    if (currentStep < STEPS.length - 1 && isStepCompleted(currentStep)) {
      goToStep(currentStep + 1);
    }
  }

  function handlePrev() {
    if (currentStep > 0) goToStep(currentStep - 1);
  }

  function handleSkip() {
    deselectCurrent();
    handleNext();
  }

  const goToCotizacion = useCallback(() => {
    const payload = {
      selections: STEP_KEYS.reduce(
        (acc, k) => {
          const p = selected[k];
          if (p) {
            acc[k] = {
              id: p.id,
              nombre: p.nombre,
              marca: p.marca,
              precio: p.precio,
              moneda: p.moneda,
              category: p.category,
              categoryKey: p.categoryKey,
              imagenUrl: p.imagenUrl,
              attrs: p.attrs,
            };
          }
          return acc;
        },
        {} as Record<string, Partial<Product>>,
      ),
      totalConsumption,
      totalPrice,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("cym-configuracion", JSON.stringify(payload));
    router.push("/cotizacion");
  }, [selected, totalConsumption, totalPrice, router]);

  /* ── Brand options for current step ──────────────────────────── */

  const currentBrands = useMemo(() => {
    const brands = new Set(
      compatibilityProducts.map((p) => p.marca),
    );
    return ["Todas", ...Array.from(brands).sort()];
  }, [compatibilityProducts]);

  /* ── Stepper line fill ───────────────────────────────────────── */

  function stepStatus(i: number) {
    if (i < currentStep) return "done";
    if (i === currentStep) return "active";
    return "pending";
  }

  /* ══════════════════════════════════════════════════════════════ */
  /*  RENDER                                                        */
  /* ══════════════════════════════════════════════════════════════ */

  return (
    <div
      className="mx-auto w-full px-4 py-8 md:px-8"
    >
      {/* ── Progress Header ─────────────────────────────────── */}
      <div
        className="mb-6 rounded-xl border p-6"
        style={{
          backgroundColor: "var(--store-surface-container-lowest)",
          borderColor: "var(--store-outline-variant)",
        }}
      >
        <h1
          className="mb-5 text-xl font-semibold"
          style={{ color: "var(--store-on-surface)" }}
        >
          Configurador de PC
        </h1>

        {/* Stepper */}
        <div className="relative flex items-center justify-between">
          {/* Background line */}
          <div
            className="absolute left-[5%] right-[5%] top-1/2 h-[2px] -z-0 -translate-y-1/2"
            style={{ backgroundColor: "var(--store-outline-variant)" }}
          />
          {/* Active line */}
          <div
            className="absolute left-[5%] top-1/2 h-[2px] -z-0 -translate-y-1/2 transition-all duration-500"
            style={{
              backgroundColor: "var(--store-primary)",
              width:
                currentStep === 0
                  ? "0%"
                  : `${(currentStep / (STEPS.length - 1)) * 90}%`,
            }}
          />

          {STEPS.map((s, i) => {
            const status = stepStatus(i);
            const active = status === "active";
            const done = status === "done";
            const locked = i > furthestReachable;
            const color = STEP_COLORS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => !locked && goToStep(i)}
                disabled={locked}
                className="flex flex-col items-center relative z-10 px-1 group disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shadow-sm transition-all duration-300"
                  style={{
                    backgroundColor: active || done ? color : "var(--store-surface-container-high)",
                    color: active || done ? "#ffffff" : "var(--store-on-surface-variant)",
                    border: !active && !done ? "2px solid var(--store-outline-variant)" : "none",
                    boxShadow: active ? `0 0 0 3px ${color}33` : "none",
                  }}
                >
                  {done ? (
                    <span className="material-symbols-outlined text-base">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-base">{s.icon}</span>
                  )}
                </div>
                <span
                  className="mt-1.5 text-[10px] font-semibold whitespace-nowrap hidden sm:block"
                  style={{
                    color: active ? color : "var(--store-on-surface-variant)",
                  }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Workspace: Two-Column Layout ─────────────────────── */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ── Left: Product Grid (65%) ─────────────────────── */}
        <div className="flex w-full flex-col gap-4 lg:w-[65%]">
          {/* Compatibility Banner */}
          {bannerText && (
            <div
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm"
              style={{
                backgroundColor: `${STEP_COLORS[stepKey]}0a`,
                borderColor: `${STEP_COLORS[stepKey]}30`,
                color: "var(--store-on-surface)",
              }}
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ color: STEP_COLORS[stepKey] }}
              >
                info
              </span>
              <span>
                {bannerText.split(/(\[Opcional\])/g).map((part, idx) =>
                  part === "[Opcional]" ? (
                    <span key={idx} className="font-bold" style={{ color: "#ef4444" }}>
                      [Opcional]
                    </span>
                  ) : (
                    <span key={idx}>{part}</span>
                  ),
                )}
              </span>
            </div>
          )}

          {/* Search & Filters */}
          <div
            className="flex flex-col items-center justify-between gap-3 rounded-xl border p-3 sm:flex-row"
            style={{
              backgroundColor: "var(--store-surface-container-lowest)",
              borderColor: "var(--store-outline-variant)",
            }}
          >
            <div className="relative w-full sm:w-1/2">
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg"
                style={{ color: "var(--store-on-surface-variant)" }}
              >
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar ${stepDef.label.toLowerCase()}...`}
                className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--store-surface-container-lowest)",
                  borderColor: "var(--store-outline-variant)",
                  color: "var(--store-on-surface)",
                  ["--tw-ring-color" as string]: STEP_COLORS[stepKey] + "40",
                }}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="rounded-lg border px-3 py-2.5 text-sm focus:outline-none"
                style={{
                  backgroundColor: "var(--store-surface-container-lowest)",
                  borderColor: "var(--store-outline-variant)",
                  color: "var(--store-on-surface)",
                }}
              >
                {currentBrands.map((b) => (
                  <option key={b} value={b}>
                    {b === "Todas" ? `Marca: ${b}` : b}
                  </option>
                ))}
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="rounded-lg border px-3 py-2.5 text-sm focus:outline-none"
                style={{
                  backgroundColor: "var(--store-surface-container-lowest)",
                  borderColor: "var(--store-outline-variant)",
                  color: "var(--store-on-surface)",
                }}
              >
                <option>Relevancia</option>
                <option>Precio: Menor a Mayor</option>
                <option>Precio: Mayor a Menor</option>
                <option>Nombre</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div
              className="flex flex-col items-center justify-center rounded-xl border py-16"
              style={{
                backgroundColor: "var(--store-surface-container-lowest)",
                borderColor: "var(--store-outline-variant)",
              }}
            >
              <div
                className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
                style={{
                  borderColor: `${STEP_COLORS[stepKey]}40`,
                  borderTopColor: STEP_COLORS[stepKey],
                }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--store-on-surface-variant)" }}
              >
                Cargando componentes...
              </p>
            </div>
          )}

          {/* Product Cards */}
          {!loading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {filteredProducts.map((product) => {
                const isSelected = selected[stepKey]?.id === product.id;
                const outOfStock = product.stock <= 0;
                const tags = buildTags(product);
                const color = STEP_COLORS[stepKey];
                return (
                  <div
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className={`group relative flex cursor-pointer flex-col rounded-xl border p-4 transition-all duration-200 ${
                      outOfStock
                        ? "opacity-50 grayscale cursor-not-allowed"
                        : "hover:shadow-md"
                    }`}
                    style={{
                      backgroundColor: isSelected
                        ? `${color}08`
                        : "var(--store-surface-container-lowest)",
                      borderColor: isSelected
                        ? color
                        : "var(--store-outline-variant)",
                      borderWidth: isSelected ? "2px" : "1px",
                    }}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div
                        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
                        style={{ backgroundColor: color }}
                      >
                        <span className="material-symbols-outlined text-sm" style={{ color: "#ffffff" }}>
                          check
                        </span>
                      </div>
                    )}

                    {/* Stock Badge */}
                    <div
                      className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: outOfStock
                          ? "var(--store-error-container)"
                          : "#E8F5E9",
                        color: outOfStock
                          ? "var(--store-on-error-container)"
                          : "#2E7D32",
                      }}
                    >
                      {outOfStock ? "Sin Stock" : "En Stock"}
                    </div>

                    {/* Image */}
                    <div className="mb-3 flex h-40 w-full items-center justify-center rounded-lg p-2" style={{ backgroundColor: "var(--store-surface-container)" }}>
                      {product.imagenUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imagenUrl}
                          alt={product.nombre}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "64px", color: `${color}40` }}
                        >
                          {CATEGORY_ICONS[product.categoryKey] || "inventory_2"}
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3
                      className="mb-1 text-sm font-semibold leading-tight"
                      style={{ color: "var(--store-on-surface)" }}
                    >
                      {product.nombre}
                    </h3>
                    <p
                      className="mb-2 text-xs"
                      style={{ color: "var(--store-on-surface-variant)" }}
                    >
                      {product.marca}
                    </p>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              backgroundColor: `${color}10`,
                              color: color,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price + Button */}
                    <div
                      className="mt-auto flex items-end justify-between border-t pt-3"
                      style={{ borderColor: "var(--store-outline-variant)" }}
                    >
                      <div>
                        <p
                          className="text-lg font-bold"
                          style={{
                            color: outOfStock
                              ? "var(--store-on-surface-variant)"
                              : "var(--store-primary)",
                          }}
                        >
                           {displayPrice(product.precio, product.moneda, currency, rate.venta)}
                        </p>
                      </div>
                      {outOfStock ? (
                        <span
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                          style={{
                            backgroundColor: "var(--store-surface-container-high)",
                            color: "var(--store-on-surface-variant)",
                          }}
                        >
                          Agotado
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSelected) {
                              deselectCurrent();
                            } else {
                              selectProduct(product);
                            }
                          }}
                          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200"
                          style={{
                            backgroundColor: isSelected ? color : "transparent",
                            color: isSelected ? "#ffffff" : color,
                            border: `1.5px solid ${color}`,
                          }}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {isSelected ? "check" : "add"}
                          </span>
                          {isSelected ? "Seleccionado" : "Agregar"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredProducts.length === 0 && (
            <div
              className="flex flex-col items-center justify-center rounded-xl border py-16"
              style={{
                backgroundColor: "var(--store-surface-container-lowest)",
                borderColor: "var(--store-outline-variant)",
              }}
            >
              <span
                className="material-symbols-outlined mb-3"
                style={{ fontSize: "48px", color: "var(--store-on-surface-variant)" }}
              >
                search_off
              </span>
              <p
                className="mb-1 text-base font-semibold"
                style={{ color: "var(--store-on-surface)" }}
              >
                Sin resultados
              </p>
              <p
                className="text-sm"
                style={{ color: "var(--store-on-surface-variant)" }}
              >
                No hay componentes compatibles que coincidan con tus filtros.
              </p>
            </div>
          )}

          {/* Step navigation buttons (mobile / bottom of grid) */}
          <div className="flex items-center justify-between">
            <button
              disabled={currentStep === 0}
              onClick={handlePrev}
              className="flex items-center gap-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-40"
              style={{
                borderColor: "var(--store-outline-variant)",
                color: "var(--store-on-surface)",
                backgroundColor: "var(--store-surface-container-lowest)",
              }}
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
              Anterior
            </button>

            <div className="flex items-center gap-2">
              <span
                className="text-sm font-medium"
                style={{ color: "var(--store-on-surface-variant)" }}
              >
                {currentStep + 1} / {STEPS.length}
              </span>
            </div>

            <button
              disabled={currentStep === STEPS.length - 1 || !isStepCompleted(currentStep)}
              onClick={handleNext}
              className="flex items-center gap-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-40"
              style={{
                borderColor: "var(--store-outline-variant)",
                color: "var(--store-on-surface)",
                backgroundColor: "var(--store-surface-container-lowest)",
              }}
            >
              Siguiente
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>

        {/* ── Right: Sticky Build Summary (35%) ──────────────── */}
        <div className="relative w-full lg:w-[35%]">
          <div
            className="sticky top-[100px] flex flex-col rounded-xl border shadow-sm overflow-hidden"
            style={{
              backgroundColor: "var(--store-surface-container-lowest)",
              borderColor: "var(--store-outline-variant)",
            }}
          >
            {/* Header */}
            <div
              className="border-b px-5 py-4"
              style={{
                borderColor: "var(--store-outline-variant)",
                backgroundColor: "var(--store-surface-container-lowest)",
              }}
            >
              <h2
                className="flex items-center gap-2 text-base font-semibold"
                style={{ color: "var(--store-on-surface)" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "var(--store-primary)" }}
                >
                  list_alt
                </span>
                Resumen de Equipo
              </h2>
            </div>

            {/* Component Slots */}
            <div
              className="max-h-[440px] flex-1 overflow-y-auto px-4 py-3"
              style={{ backgroundColor: "var(--store-surface)" }}
            >
              {STEPS.map((s, i) => {
                const item = selected[s.key];
                const isCurrent = i === currentStep;
                const locked = i > furthestReachable;
                const color = STEP_COLORS[s.key];
                const isOpt =
                  (s.key === "gpu" && toBool(selected.cpu?.attrs.tieneGraficosIntegrados)) ||
                  (s.key === "cooler" && !toBool(selected.cpu?.attrs.requiereCooler)) ||
                  (s.key === "psu" && toBool(selected.case?.attrs.tieneFuentePoder));
                return (
                  <div
                    key={s.key}
                    onClick={() => !locked && goToStep(i)}
                    className={`mb-2 flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all ${locked ? "cursor-not-allowed opacity-30" : "cursor-pointer"}`}
                    style={{
                      borderColor: isCurrent ? color : "var(--store-outline-variant)",
                      borderStyle: isCurrent && !item ? "dashed" : "solid",
                      backgroundColor: isCurrent
                        ? `${color}08`
                        : "var(--store-surface-container-lowest)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden"
                        style={{
                          backgroundColor: item
                            ? `${color}18`
                            : "var(--store-surface-container-high)",
                          color: item ? color : "var(--store-on-surface-variant)",
                        }}
                      >
                        {item?.imagenUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imagenUrl}
                            alt={item.nombre}
                            className="h-full w-full object-contain p-0.5"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-base">
                            {s.icon}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{
                            color: isCurrent ? color : "var(--store-on-surface)",
                          }}
                        >
                          {s.label}
                          {isOpt && (
                            <span className="text-[10px] font-bold" style={{ color: "#ef4444" }}>
                              [Opcional]
                            </span>
                          )}
                        </p>
                        <p
                          className="truncate text-[11px]"
                          style={{
                            color: "var(--store-on-surface-variant)",
                            fontStyle: item ? "normal" : "italic",
                          }}
                        >
                          {item
                            ? item.nombre
                            : isCurrent
                              ? "Pendiente de selección"
                              : "---"}
                        </p>
                      </div>
                    </div>
                    <span
                      className="ml-2 whitespace-nowrap text-[11px] font-semibold"
                      style={{ color: item ? "var(--store-primary)" : "var(--store-on-surface-variant)" }}
                    >
                      {item ? displayPrice(item.precio, item.moneda, currency, rate.venta) : currency === "USD" ? "$0.00" : "S/0.00"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Power Estimation */}
            <div
              className="border-t px-5 py-4"
              style={{
                borderColor: "var(--store-outline-variant)",
                backgroundColor: "var(--store-surface-container-lowest)",
              }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span
                  className="flex items-center gap-1 text-xs font-semibold"
                  style={{ color: "var(--store-on-surface-variant)" }}
                >
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Consumo Estimado
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: "var(--store-on-surface)" }}
                >
                  {totalConsumption}W
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: "var(--store-outline-variant)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor:
                      totalConsumption > 700
                        ? "var(--store-error)"
                        : totalConsumption > 500
                          ? "#d97706"
                          : "var(--store-success)",
                    width: `${Math.min((totalConsumption / 850) * 100, 100)}%`,
                  }}
                />
              </div>
              <p
                className="mt-1 text-right text-[10px]"
                style={{ color: "var(--store-on-surface-variant)" }}
              >
                CPU {toNum(selected.cpu?.attrs.tdp)}W
                {selected.gpu ? ` + GPU ${toNum(selected.gpu.attrs.consumoRecomendadoFuenteWatts)}W` : ""}
              </p>
            </div>

            {/* Total & CTA */}
            <div
              className="border-t px-5 py-4"
              style={{
                borderColor: "var(--store-outline-variant)",
                backgroundColor: "var(--store-surface-container-lowest)",
              }}
            >
              <div className="mb-3 flex items-end justify-between">
                <span
                  className="text-sm"
                  style={{ color: "var(--store-on-surface-variant)" }}
                >
                  Total Parcial
                </span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: "var(--store-primary)" }}
                >
                  {formatPrice(totalPrice, currency)}
                </span>
              </div>

              {requiredCompleted ? (
                <button
                  onClick={goToCotizacion}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-base font-semibold transition-colors"
                  style={{
                    backgroundColor: "var(--store-primary)",
                    color: "var(--store-on-primary)",
                  }}
                >
                  <span className="material-symbols-outlined">visibility</span>
                  Ver Resumen
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-base font-semibold transition-colors"
                  style={{
                    backgroundColor: STEP_COLORS[stepKey],
                    color: "#ffffff",
                  }}
                >
                  Continuar
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              )}

              <p
                className="mt-2 text-center text-[11px]"
                style={{ color: "var(--store-on-surface-variant)" }}
              >
                {selectedCount} de {STEPS.length} componentes seleccionados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
