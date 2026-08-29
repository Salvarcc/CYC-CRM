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
  ssd: "storage",
  monitor: "monitor",
};

/* ── Extras (opcionales) ─────────────────────────────────────────── */

const EXTRAS = [
  { key: "ssd", categoryKey: "ssd", label: "SSD / Almacenamiento", icon: "storage", color: "#475569" },
  { key: "monitor", categoryKey: "monitor", label: "Monitor", icon: "monitor", color: "#0ea5e9" },
] as const;

type ExtraKey = (typeof EXTRAS)[number]["key"];

const EXTRA_COLORS: Record<ExtraKey, string> = {
  ssd: "#475569",
  monitor: "#0ea5e9",
};

function buildExtraTags(p: Product): string[] {
  const a = p.attrs;
  switch (p.categoryKey) {
    case "ssd":
      return [
        `${a.capacidadGB}GB`,
        a.formato as string,
        a.interfaz as string,
        a.lecturaMBs ? `Lectura ${a.lecturaMBs}MB/s` : null,
      ].filter(Boolean) as string[];
    case "monitor":
      return [
        a.tamano as string,
        a.resolucion as string,
        a.tipoPanel as string,
        a.tasaRefrescoHz ? `${a.tasaRefrescoHz}Hz` : null,
      ].filter(Boolean) as string[];
    default:
      return [];
  }
}

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
    const res = await fetch("/api/products?inStock=true&cotizador=true");
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
  const [extras, setExtras] = useState<Record<ExtraKey, Product | null>>({
    ssd: null,
    monitor: null,
  });
  const [activeExtra, setActiveExtra] = useState<ExtraKey | null>(null);
  const [activeRamSlot, setActiveRamSlot] = useState<number | null>(null);
  const [ramExtra, setRamExtra] = useState<(Product | null)[]>([]);
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
            extras?: Record<string, Partial<Product>>;
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

          /* Restore extras */
          const restoredExtras: Record<ExtraKey, Product | null> = {
            ssd: null,
            monitor: null,
          };
          for (const ex of EXTRAS) {
            const savedExtra = saved.extras?.[ex.key];
            if (savedExtra?.id) {
              const fullProduct = data.find((p) => p.id === savedExtra.id);
              if (fullProduct) restoredExtras[ex.key] = fullProduct;
            }
          }
          setExtras(restoredExtras);

          /* Restore extra RAM sticks (bounded by motherboard ramSlots) */
          const mbRestored = restored.motherboard;
          const maxExtra = mbRestored
            ? Math.max(1, toNum(mbRestored.attrs.ramSlots)) - 1
            : 0;
          const savedRamExtra = (saved as { ramExtra?: (Partial<Product> | null)[] })
            .ramExtra ?? [];
          const restoredRamExtra: (Product | null)[] = [];
          for (let i = 0; i < maxExtra; i++) {
            const item = savedRamExtra[i];
            if (!item?.id) {
              restoredRamExtra.push(null);
              continue;
            }
            const full = data.find((p) => p.id === item.id);
            restoredRamExtra.push(full ?? null);
          }
          setRamExtra(restoredRamExtra);

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

  /* ── Unified active "view": a required step, an extra, or a RAM slot ── */

  const isExtraView = activeExtra !== null;
  const isRamSlotView = !isExtraView && activeRamSlot !== null;
  const activeExtraDef = isExtraView
    ? EXTRAS.find((e) => e.key === activeExtra) ?? null
    : null;
  const viewLabel = activeExtraDef
    ? activeExtraDef.label
    : isRamSlotView
      ? `Ranura RAM ${activeRamSlot! + 1}`
      : stepDef.label;
  const viewColor = activeExtraDef
    ? EXTRA_COLORS[activeExtra!]
    : isRamSlotView
      ? STEP_COLORS.ram
      : STEP_COLORS[stepKey];
  const viewIcon = activeExtraDef
    ? activeExtraDef.icon
    : isRamSlotView
      ? "dns"
      : stepDef.icon;

  const selectedCpu = selected.cpu;
  const selectedMotherboard = selected.motherboard;
  const selectedGpu = selected.gpu;
  const selectedCooler = selected.cooler;
  const selectedCase = selected.case;

  /* ── RAM slots (derived from motherboard ramSlots) ─────────────── */

  const ramSlotCount = Math.max(1, toNum(selectedMotherboard?.attrs.ramSlots));
  const ramSticks = useMemo<(Product | null)[]>(() => {
    const arr: (Product | null)[] = [selected.ram];
    for (let i = 0; i < ramSlotCount - 1; i++) arr.push(ramExtra[i] ?? null);
    return arr;
  }, [selected.ram, ramExtra, ramSlotCount]);

  const ramCompatibleProducts = useMemo(() => {
    let list = products.filter((p) => p.categoryKey === "ram");
    if (selectedMotherboard) {
      const mbTypes = toStringArray(selectedMotherboard.attrs.tipoMemoria);
      list = list.filter(
        (p) =>
          p.stock > 0 &&
          mbTypes.includes(p.attrs.tipoMemoria as string),
      );
    }
    return list;
  }, [products, selectedMotherboard]);

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

  /* ── Base product list for the active view ───────────────────── */

  const viewBase = useMemo(() => {
    if (activeExtra) {
      return products.filter(
        (p) => p.categoryKey === activeExtra && p.stock > 0,
      );
    }
    if (isRamSlotView) {
      return ramCompatibleProducts;
    }
    return compatibilityProducts;
  }, [activeExtra, isRamSlotView, ramCompatibleProducts, products, compatibilityProducts]);

  /* ── Search, brand, sort filtering ───────────────────────────── */

  const filteredProducts = useMemo(() => {
    let list = viewBase;

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
  }, [viewBase, search, brandFilter, sortOrder]);

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
      ) +
      EXTRAS.reduce(
        (sum, ex) => sum + toPreferredCurrency(extras[ex.key]?.precio ?? 0, extras[ex.key]?.moneda ?? "USD", currency, rate.venta),
        0,
      ) +
      ramExtra.reduce(
        (sum, p) => sum + toPreferredCurrency(p?.precio ?? 0, p?.moneda ?? "USD", currency, rate.venta),
        0,
      ),
    [selected, extras, ramExtra, currency, rate.venta],
  );

  const totalConsumption = useMemo(() => {
    const cpuW = toNum(selected.cpu?.attrs.tdp);
    const gpuW = toNum(selected.gpu?.attrs.consumoRecomendadoFuenteWatts);
    return cpuW + gpuW;
  }, [selected.cpu, selected.gpu]);

  const selectedCount = STEP_KEYS.filter((k) => !!selected[k]).length;

  const selectedExtrasCount = EXTRAS.filter((ex) => !!extras[ex.key]).length;

  /* ── Toggle an extra on/off ──────────────────────────────────── */

  function toggleExtra(key: ExtraKey, product: Product) {
    if (product.stock <= 0) return;
    setExtras((prev) =>
      prev[key]?.id === product.id ? { ...prev, [key]: null } : { ...prev, [key]: product },
    );
  }

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
    /* Changing the motherboard (or first RAM stick) invalidates
       the extra RAM sticks, since slot count / type may change */
    if (stepKey === "motherboard") {
      setRamExtra([]);
    }
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
    if (stepKey === "ram" || stepKey === "motherboard") setRamExtra([]);
  }

  function selectRamSlotProduct(slotIndex: number, product: Product) {
    if (product.stock <= 0) return;
    if (slotIndex === 0) {
      selectProduct(product);
      return;
    }
    setRamExtra((prev) => {
      const next = [...prev];
      next[slotIndex - 1] = product;
      return next;
    });
    setActiveRamSlot(null);
    setSearch("");
    setBrandFilter("Todas");
    setSortOrder("Relevancia");
  }

  function clearRamSlot(slotIndex: number) {
    if (slotIndex === 0) {
      deselectCurrent();
      return;
    }
    setRamExtra((prev) => {
      const next = [...prev];
      next[slotIndex - 1] = null;
      return next;
    });
  }

  function selectViewProduct(product: Product) {
    if (isExtraView) {
      toggleExtra(activeExtra!, product);
    } else if (isRamSlotView) {
      selectRamSlotProduct(activeRamSlot!, product);
    } else {
      selectProduct(product);
    }
  }

  function isViewSelected(product: Product): boolean {
    if (isExtraView) return extras[activeExtra!]?.id === product.id;
    if (isRamSlotView) return ramSticks[activeRamSlot!]?.id === product.id;
    return selected[stepKey]?.id === product.id;
  }

  function deselectView() {
    if (isExtraView) {
      setExtras((prev) => ({ ...prev, [activeExtra!]: null }));
    } else if (isRamSlotView) {
      clearRamSlot(activeRamSlot!);
      setActiveRamSlot(null);
    } else {
      deselectCurrent();
    }
  }

  function buildViewTags(product: Product): string[] {
    if (isExtraView) return buildExtraTags(product);
    return buildTags(product);
  }

  function goToStep(i: number) {
    if (i > furthestReachable) return;
    setCurrentStep(i);
    setActiveExtra(null);
    setActiveRamSlot(null);
    setSearch("");
    setBrandFilter("Todas");
    setSortOrder("Relevancia");
  }

  function openExtra(key: ExtraKey) {
    setActiveExtra(key);
    setActiveRamSlot(null);
    setSearch("");
    setBrandFilter("Todas");
    setSortOrder("Relevancia");
  }

  function openRamSlot(i: number) {
    setActiveExtra(null);
    setActiveRamSlot(i);
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
      extras: EXTRAS.reduce(
        (acc, ex) => {
          const p = extras[ex.key];
          if (p) {
            acc[ex.key] = {
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
      ramExtra: ramExtra
        .map((p) =>
          p
            ? {
                id: p.id,
                nombre: p.nombre,
                marca: p.marca,
                precio: p.precio,
                moneda: p.moneda,
                category: p.category,
                categoryKey: p.categoryKey,
                imagenUrl: p.imagenUrl,
                attrs: p.attrs,
              }
            : null,
        )
        .filter(Boolean) as Partial<Product>[],
      totalConsumption,
      totalPrice,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("cym-configuracion", JSON.stringify(payload));
    router.push("/cotizacion");
  }, [selected, extras, ramExtra, totalConsumption, totalPrice, router]);

  /* ── Brand options for current step ──────────────────────────── */

  const currentBrands = useMemo(() => {
    const brands = new Set(
      viewBase.map((p) => p.marca),
    );
    return ["Todas", ...Array.from(brands).sort()];
  }, [viewBase]);

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
        <div className="relative flex items-center">
          {/* Background line — spans first↔last icon centers */}
          <div
            className="absolute h-[2px] -z-0 -translate-y-1/2"
            style={{
              top: "18px",
              left: `${(0.5 / STEPS.length) * 100}%`,
              right: `${(0.5 / STEPS.length) * 100}%`,
              backgroundColor: "var(--store-outline-variant)",
            }}
          />
          {/* Active line — first icon center → current icon center */}
          <div
            className="absolute h-[2px] -z-0 -translate-y-1/2 transition-all duration-500"
            style={{
              top: "18px",
              left: `${(0.5 / STEPS.length) * 100}%`,
              width: `${(currentStep / STEPS.length) * 100}%`,
              backgroundColor: "var(--store-primary)",
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
                className="relative z-10 flex flex-1 flex-col items-center px-1 group disabled:cursor-not-allowed disabled:opacity-40"
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
          {/* Category header */}
          <div
            className="flex items-center justify-between rounded-xl border px-4 py-3"
            style={{
              backgroundColor: "var(--store-surface-container-lowest)",
              borderColor: viewColor + "45",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${viewColor}18`, color: viewColor }}
              >
                <span className="material-symbols-outlined text-base">{viewIcon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--store-on-surface)" }}>
                  {viewLabel}
                </p>
                <p className="text-[11px]" style={{ color: "var(--store-on-surface-variant)" }}>
                  {isExtraView
                    ? "Componente opcional"
                    : isRamSlotView
                      ? "Ranura de RAM"
                      : "Paso " + (currentStep + 1) + " de " + STEPS.length}
                </p>
              </div>
            </div>
          </div>

          {/* Compatibility Banner */}
          {!isExtraView && !isRamSlotView && bannerText && (
            <div
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm"
              style={{
                backgroundColor: `${viewColor}0a`,
                borderColor: `${viewColor}30`,
                color: "var(--store-on-surface)",
              }}
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ color: viewColor }}
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
                placeholder={`Buscar ${viewLabel.toLowerCase()}...`}
                className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--store-surface-container-lowest)",
                  borderColor: "var(--store-outline-variant)",
                  color: "var(--store-on-surface)",
                  ["--tw-ring-color" as string]: viewColor + "40",
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
                  borderColor: `${viewColor}40`,
                  borderTopColor: viewColor,
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
                const isSelected = isViewSelected(product);
                const outOfStock = product.stock <= 0;
                const tags = buildViewTags(product);
                const color = viewColor;
                return (
                  <div
                    key={product.id}
                    onClick={() => selectViewProduct(product)}
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
                          : "var(--store-badge-green-bg)",
                        color: outOfStock
                          ? "var(--store-on-error-container)"
                          : "var(--store-badge-green-fg)",
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
                              deselectView();
                            } else {
                              selectViewProduct(product);
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
          {!isExtraView && (
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
          )}
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
                const ramExtraCount =
                  s.key === "ram" ? ramExtra.filter(Boolean).length : 0;
                return (
                  <div key={s.key} className="mb-2">
                    {/* Main component row */}
                    <div
                      onClick={() => !locked && goToStep(i)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all ${locked ? "cursor-not-allowed opacity-30" : "cursor-pointer"}`}
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
                              ? s.key === "ram" && ramExtraCount > 0
                                ? `${item.nombre} (+${ramExtraCount} módulo${ramExtraCount > 1 ? "s" : ""})`
                                : item.nombre
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

                    {/* RAM module slots (below the RAM row, based on motherboard ramSlots) */}
                    {s.key === "ram" && ramSlotCount > 1 && (
                      <div
                        className="mt-1.5 grid grid-cols-1 gap-1.5 rounded-lg border border-dashed p-2"
                        style={{
                          borderColor: "var(--store-outline-variant)",
                          backgroundColor: "var(--store-surface-container-lowest)",
                        }}
                      >
                        {ramSticks.map((stick, idx) => {
                          const isOptional = idx > 0;
                          const slotActive = isRamSlotView && activeRamSlot === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (idx === 0) {
                                  goToStep(currentStep);
                                } else {
                                  openRamSlot(idx);
                                }
                              }}
                              className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left transition-all ${
                                stick ? "" : "border-dashed"
                              }`}
                              style={{
                                borderColor: slotActive
                                  ? STEP_COLORS.ram
                                  : stick
                                    ? `${STEP_COLORS.ram}80`
                                    : "var(--store-outline-variant)",
                                backgroundColor: slotActive
                                  ? `${STEP_COLORS.ram}10`
                                  : stick
                                    ? `${STEP_COLORS.ram}08`
                                    : "transparent",
                              }}
                            >
                              <div className="flex min-w-0 items-center gap-1.5">
                                <div className="min-w-0 flex-1">
                                  <p className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--store-on-surface)" }}>
                                    RAM {idx + 1}
                                    {isOptional && (
                                      <span className="text-[9px] font-bold" style={{ color: "#ef4444" }}>
                                        [Opc.]
                                      </span>
                                    )}
                                  </p>
                                  <p
                                    className="truncate text-[10px]"
                                    style={{
                                      color: stick
                                        ? "var(--store-on-surface-variant)"
                                        : STEP_COLORS.ram,
                                      fontStyle: stick ? "normal" : "italic",
                                    }}
                                  >
                                    {stick ? stick.nombre : "Elegir módulo"}
                                  </p>
                                </div>
                              </div>
                              <span
                                className="ml-1 whitespace-nowrap text-[10px] font-semibold"
                                style={{
                                  color: stick
                                    ? "var(--store-primary)"
                                    : "var(--store-on-surface-variant)",
                                }}
                              >
                                {stick
                                  ? displayPrice(stick.precio, stick.moneda, currency, rate.venta)
                                  : currency === "USD"
                                    ? "$0.00"
                                    : "S/0.00"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Opcionales (SSD · Monitor) ─────────────────── */}
              <div
                className="mb-2 flex items-center gap-1.5 px-1 pt-3 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--store-on-surface-variant)" }}
              >
                Opcionales
              </div>

              {EXTRAS.map((ex) => {
                const exKey = ex.key;
                const color = EXTRA_COLORS[exKey];
                const item = extras[exKey];
                const isActive = activeExtra === exKey;
                return (
                  <div
                    key={exKey}
                    onClick={() =>
                      isActive
                        ? goToStep(currentStep)
                        : openExtra(exKey)
                    }
                    className="mb-2 flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 transition-all hover:bg-[var(--store-surface-container-low)]"
                    style={{
                      borderColor: isActive ? color : "var(--store-outline-variant)",
                      borderStyle: item ? "solid" : "dashed",
                      backgroundColor: isActive
                        ? `${color}08`
                        : "var(--store-surface-container-lowest)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden"
                        style={{
                          backgroundColor: item ? `${color}18` : "var(--store-surface-container-high)",
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
                            {ex.icon}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: "var(--store-on-surface)" }}
                        >
                          {ex.label}
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: "#ef4444" }}
                          >
                            [Opcional]
                          </span>
                        </p>
                        <p
                          className="truncate text-[11px]"
                          style={{
                            color: "var(--store-on-surface-variant)",
                            fontStyle: item ? "normal" : "italic",
                          }}
                        >
                          {item ? item.nombre : "Elegir producto"}
                        </p>
                      </div>
                    </div>
                    <span
                      className="ml-2 flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold"
                      style={{ color: item ? "var(--store-primary)" : "var(--store-on-surface-variant)" }}
                    >
                      {item
                        ? displayPrice(item.precio, item.moneda, currency, rate.venta)
                        : currency === "USD"
                          ? "$0.00"
                          : "S/0.00"}
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
                {selectedCount} de {STEPS.length} componentes
                {selectedExtrasCount > 0
                  ? ` + ${selectedExtrasCount} extra${selectedExtrasCount > 1 ? "s" : ""}`
                  : ""}{" "}
                seleccionados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
