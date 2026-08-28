"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";
import { displayPrice, formatPrice, toPreferredCurrency } from "@/utils/currency";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CotizacionItem {
  id: string;
  stepKey: string;
  productId: string;
  nombre: string;
  marca: string;
  precio: number | null;
  moneda: string;
  imagenUrl: string | null;
  category: string;
  categoryKey: string;
}

interface Cotizacion {
  id: string;
  numero: string;
  totalConsumption: number;
  totalPrice: number;
  moneda: string;
  configuracion: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
  items: CotizacionItem[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEP_META: Record<string, { label: string; icon: string; color: string }> = {
  cpu: { label: "Procesador (CPU)", icon: "memory", color: "#b7131a" },
  motherboard: { label: "Placa Madre", icon: "developer_board", color: "#00658d" },
  ram: { label: "Memoria RAM", icon: "dns", color: "#515c71" },
  gpu: { label: "Tarjeta de Video", icon: "waves", color: "#7c3aed" },
  cooler: { label: "Refrigeración", icon: "ac_unit", color: "#0ea5e9" },
  case: { label: "Gabinete", icon: "desktop_windows", color: "#d97706" },
  psu: { label: "Fuente de Poder", icon: "power", color: "#059669" },
};

const STEP_ORDER = ["cpu", "motherboard", "ram", "gpu", "cooler", "case", "psu"] as const;

const EXTRA_META: Record<string, { label: string; icon: string; color: string }> = {
  ssd: { label: "SSD / Almacenamiento", icon: "storage", color: "#1d4ed8" },
  monitor: { label: "Monitor", icon: "monitor", color: "#7c3aed" },
};

const EXTRA_ORDER = ["ssd", "monitor"] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeRemaining(expiresAt: string): { hours: number; minutes: number; total: number } {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const diff = Math.max(0, exp - now);
  return {
    total: diff,
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
  };
}

function expiryColor(expiresAt: string): string {
  const { total } = timeRemaining(expiresAt);
  if (total <= 0) return "#ef4444";
  if (total < 6 * 60 * 60 * 1000) return "#ef4444";
  if (total < 24 * 60 * 60 * 1000) return "#d97706";
  return "#22c55e";
}

function expiryLabel(expiresAt: string): string {
  const { hours, minutes, total } = timeRemaining(expiresAt);
  if (total <= 0) return "Expirada";
  if (hours > 0) return `${hours}h ${minutes}m restantes`;
  return `${minutes}m restantes`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MisCotizacionesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { currency, rate } = useCurrency();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  /* ── Fetch cotizaciones ─────────────────────────────────────── */

  const fetchCotizaciones = useCallback(async () => {
    try {
      const res = await fetch("/api/cotizaciones");
      if (!res.ok) return;
      const data = await res.json();
      setCotizaciones(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCotizaciones().then(() => setLoading(false));
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchCotizaciones]);

  /* ── Countdown ticker ──────────────────────────────────────── */

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  /* ── Handlers ───────────────────────────────────────────────── */

  async function handleDelete(id: string, numero: string) {
    if (!confirm(`¿Eliminar cotización ${numero}?`)) return;
    try {
      const res = await fetch(`/api/cotizaciones/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("No se pudo eliminar la cotización.");
        return;
      }
      setCotizaciones((prev) => prev.filter((c) => c.id !== id));
      toast.success(`Cotización ${numero} eliminada.`);
    } catch {
      toast.error("Error de red al eliminar.");
    }
  }

  function handleWhatsApp(c: Cotizacion) {
    const config = c.configuracion as Record<string, { nombre: string; marca: string; precio: number | null; moneda: string; imagenUrl?: string | null }>;
    const extras = (config.extras ?? {}) as Record<string, { nombre: string; marca: string; precio: number | null; moneda: string; imagenUrl?: string | null }>;
    const lines: string[] = [];
    for (const key of STEP_ORDER) {
      const p = config[key];
      if (!p) continue;
      const meta = STEP_META[key];
      lines.push(`${meta.label}: ${p.nombre} — ${displayPrice(p.precio, p.moneda, currency, rate.venta)}`);
    }
    for (const key of EXTRA_ORDER) {
      const p = extras[key];
      if (!p) continue;
      const meta = EXTRA_META[key];
      lines.push(`${meta.label} (Opcional): ${p.nombre} — ${displayPrice(p.precio, p.moneda, currency, rate.venta)}`);
    }
    const total = STEP_ORDER.reduce((sum, k) => {
      const p = config[k];
      if (!p) return sum;
      return sum + toPreferredCurrency(p.precio ?? 0, p.moneda ?? "USD", currency, rate.venta);
    }, 0) + EXTRA_ORDER.reduce((sum, k) => {
      const p = extras[k];
      if (!p) return sum;
      return sum + toPreferredCurrency(p.precio ?? 0, p.moneda ?? "USD", currency, rate.venta);
    }, 0);
    lines.push("");
    lines.push(`Consumo estimado: ${c.totalConsumption}W`);
    lines.push(`Total: ${formatPrice(total, currency)}`);
    const text = encodeURIComponent(
      `Hola, me interesa esta configuración de PC (${c.numero}):\n\n${lines.join("\n")}\n\n¿Podrían confirmar disponibilidad y precio final?`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function handleEmail(c: Cotizacion) {
    const config = c.configuracion as Record<string, { nombre: string; marca: string; precio: number | null; moneda: string; imagenUrl?: string | null }>;
    const extras = (config.extras ?? {}) as Record<string, { nombre: string; marca: string; precio: number | null; moneda: string; imagenUrl?: string | null }>;
    const lines: string[] = [];
    for (const key of STEP_ORDER) {
      const p = config[key];
      if (!p) continue;
      const meta = STEP_META[key];
      lines.push(`${meta.label}: ${p.nombre} — ${displayPrice(p.precio, p.moneda, currency, rate.venta)}`);
    }
    for (const key of EXTRA_ORDER) {
      const p = extras[key];
      if (!p) continue;
      const meta = EXTRA_META[key];
      lines.push(`${meta.label} (Opcional): ${p.nombre} — ${displayPrice(p.precio, p.moneda, currency, rate.venta)}`);
    }
    const total = STEP_ORDER.reduce((sum, k) => {
      const p = config[k];
      if (!p) return sum;
      return sum + toPreferredCurrency(p.precio ?? 0, p.moneda ?? "USD", currency, rate.venta);
    }, 0) + EXTRA_ORDER.reduce((sum, k) => {
      const p = extras[k];
      if (!p) return sum;
      return sum + toPreferredCurrency(p.precio ?? 0, p.moneda ?? "USD", currency, rate.venta);
    }, 0);
    lines.push("");
    lines.push(`Consumo estimado: ${c.totalConsumption}W`);
    lines.push(`Total: ${formatPrice(total, currency)}`);
    const subject = encodeURIComponent(`Cotización PC — ${c.numero}`);
    const body = encodeURIComponent(
      `Hola,\n\nAdjunto la configuración de PC que me interesa:\n\n${lines.join("\n")}\n\nQuedo atento a su respuesta.\n\nSaludos.`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  async function handleDownloadPDF(c: Cotizacion) {
    try {
      const { generateQuotationPDF } = await import("@/utils/pdf");
      const config = c.configuracion as Record<string, unknown>;
      const configData = {
        selections: config as Record<string, never>,
        extras: (config.extras ?? {}) as Record<string, never>,
        totalConsumption: c.totalConsumption,
        totalPrice: c.totalPrice,
        timestamp: c.createdAt,
      };
      await generateQuotationPDF(configData, currency, rate.venta);
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Error al generar el PDF.");
    }
  }

  /* ── Loading ────────────────────────────────────────────────── */

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{
            borderColor: "var(--store-outline-variant)",
            borderTopColor: "var(--store-primary)",
          }}
        />
      </div>
    );
  }

  /* ── Not authenticated ─────────────────────────────────────── */

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
        <span
          className="material-symbols-outlined mb-4"
          style={{ fontSize: "64px", color: "var(--store-on-surface-variant)" }}
        >
          lock
        </span>
        <h1
          className="mb-2 text-2xl font-bold"
          style={{ color: "var(--store-on-surface)" }}
        >
          Inicia sesión
        </h1>
        <p
          className="mb-6 text-sm"
          style={{ color: "var(--store-on-surface-variant)" }}
        >
          Debes iniciar sesión para ver tus cotizaciones guardadas.
        </p>
        <Link
          href="/login"
          className="flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: "var(--store-primary)",
            color: "var(--store-on-primary)",
          }}
        >
          <span className="material-symbols-outlined text-base">login</span>
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  /* ── Empty state ────────────────────────────────────────────── */

  if (cotizaciones.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
        <span
          className="material-symbols-outlined mb-4"
          style={{ fontSize: "64px", color: "var(--store-on-surface-variant)" }}
        >
          bookmark_border
        </span>
        <h1
          className="mb-2 text-2xl font-bold"
          style={{ color: "var(--store-on-surface)" }}
        >
          Sin cotizaciones guardadas
        </h1>
        <p
          className="mb-6 text-sm"
          style={{ color: "var(--store-on-surface-variant)" }}
        >
          Usa el configurador para armar tu PC y guardar la cotización aquí.
        </p>
        <Link
          href="/configurador"
          className="flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: "var(--store-primary)",
            color: "var(--store-on-primary)",
          }}
        >
          <span className="material-symbols-outlined text-base">build</span>
          Ir al Configurador
        </Link>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════ */
  /*  RENDER                                                        */
  /* ══════════════════════════════════════════════════════════════ */

  return (
    <div className="mx-auto w-full px-4 py-10 md:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--store-on-surface)" }}
          >
            Mis Cotizaciones
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--store-on-surface-variant)" }}
          >
            Cotizaciones guardadas del configurador PC Builder.
          </p>
        </div>
        <Link
          href="/configurador"
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: "var(--store-primary)",
            color: "var(--store-on-primary)",
          }}
        >
          <span className="material-symbols-outlined text-base">add</span>
          Nueva Cotización
        </Link>
      </div>

      {/* Cotizaciones List */}
      <div className="flex flex-col gap-4">
        {cotizaciones.map((c) => {
          const isExpanded = expandedId === c.id;
          const color = expiryColor(c.expiresAt);
          const config = c.configuracion as Record<string, { nombre: string; marca: string; precio: number | null; moneda: string; imagenUrl?: string | null }>;
          const extras = (config.extras ?? {}) as Record<string, { nombre: string; marca: string; precio: number | null; moneda: string; imagenUrl?: string | null }>;
          const total = STEP_ORDER.reduce((sum, k) => {
            const p = config[k];
            if (!p) return sum;
            return sum + toPreferredCurrency(p.precio ?? 0, p.moneda ?? "USD", currency, rate.venta);
          }, 0) + EXTRA_ORDER.reduce((sum, k) => {
            const p = extras[k];
            if (!p) return sum;
            return sum + toPreferredCurrency(p.precio ?? 0, p.moneda ?? "USD", currency, rate.venta);
          }, 0);

          return (
            <div
              key={c.id}
              className="overflow-hidden rounded-xl border transition-all"
              style={{
                backgroundColor: "var(--store-surface-container-lowest)",
                borderColor: "var(--store-outline-variant)",
              }}
            >
              {/* Card Header */}
              <div
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ cursor: "pointer" }}
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "var(--store-surface-container-low)" }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ color: "var(--store-primary)" }}
                    >
                      description
                    </span>
                  </div>
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "var(--store-on-surface)" }}
                    >
                      {c.numero}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--store-on-surface-variant)" }}
                    >
                      {new Date(c.createdAt).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Expiry badge */}
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold"
                    style={{
                      backgroundColor: `${color}18`,
                      color,
                    }}
                  >
                    {expiryLabel(c.expiresAt)}
                  </span>

                  {/* Total */}
                  <span
                    className="text-lg font-bold"
                    style={{ color: "var(--store-primary)" }}
                  >
                    {formatPrice(total, currency)}
                  </span>

                  {/* Expand arrow */}
                  <span
                    className="material-symbols-outlined transition-transform"
                    style={{
                      color: "var(--store-on-surface-variant)",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    expand_more
                  </span>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div
                  className="border-t px-5 py-4"
                  style={{ borderColor: "var(--store-outline-variant)" }}
                >
                  {/* Components Table */}
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr
                          className="border-b text-xs font-bold uppercase tracking-widest"
                          style={{
                            borderColor: "var(--store-outline-variant)",
                            color: "var(--store-on-surface-variant)",
                          }}
                        >
                          <th className="px-3 py-2">Componente</th>
                          <th className="hidden px-3 py-2 md:table-cell">Detalle</th>
                          <th className="px-3 py-2 text-right">Precio ({currency})</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {STEP_ORDER.filter((k) => config[k]).map((k, i) => {
                          const p = config[k];
                          const meta = STEP_META[k];
                          return (
                            <tr
                              key={k}
                              className="border-b"
                              style={{
                                borderColor: "var(--store-outline-variant)",
                                backgroundColor: i % 2 === 1 ? "var(--store-surface-container-low)" : "transparent",
                              }}
                            >
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="material-symbols-outlined text-base"
                                    style={{ color: meta.color }}
                                  >
                                    {meta.icon}
                                  </span>
                                  <span
                                    className="text-xs font-semibold"
                                    style={{ color: "var(--store-on-surface)" }}
                                  >
                                    {meta.label}
                                  </span>
                                </div>
                              </td>
                              <td
                                className="hidden px-3 py-2.5 md:table-cell"
                                style={{ color: "var(--store-on-surface-variant)" }}
                              >
                                <span className="text-xs font-mono">
                                  {p.marca} — {p.nombre}
                                </span>
                              </td>
                              <td
                                className="px-3 py-2.5 text-right font-bold"
                                style={{ color: "var(--store-on-surface)" }}
                              >
                                <span className="font-mono text-xs">
                                  {displayPrice(p.precio, p.moneda, currency, rate.venta)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {EXTRA_ORDER.filter((k) => extras[k]).map((k, i) => {
                          const p = extras[k];
                          const meta = EXTRA_META[k];
                          return (
                            <tr
                              key={k}
                              className="border-b"
                              style={{
                                borderColor: "var(--store-outline-variant)",
                                backgroundColor: i % 2 === 1 ? "var(--store-surface-container-low)" : "transparent",
                              }}
                            >
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="material-symbols-outlined text-base"
                                    style={{ color: meta.color }}
                                  >
                                    {meta.icon}
                                  </span>
                                  <span
                                    className="text-xs font-semibold"
                                    style={{ color: "var(--store-on-surface)" }}
                                  >
                                    {meta.label} <span className="font-normal" style={{ color: "var(--store-on-surface-variant)" }}>[Opcional]</span>
                                  </span>
                                </div>
                              </td>
                              <td
                                className="hidden px-3 py-2.5 md:table-cell"
                                style={{ color: "var(--store-on-surface-variant)" }}
                              >
                                <span className="text-xs font-mono">
                                  {p.marca} — {p.nombre}
                                </span>
                              </td>
                              <td
                                className="px-3 py-2.5 text-right font-bold"
                                style={{ color: "var(--store-on-surface)" }}
                              >
                                <span className="font-mono text-xs">
                                  {displayPrice(p.precio, p.moneda, currency, rate.venta)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Consumption */}
                  <div className="mb-4 flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ color: "var(--store-info)" }}
                    >
                      bolt
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--store-on-surface-variant)" }}
                    >
                      Consumo estimado: ~{c.totalConsumption}W
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleWhatsApp(c)}
                      className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all hover:opacity-90"
                      style={{ backgroundColor: "#25D366", color: "#ffffff" }}
                    >
                      <span className="material-symbols-outlined fill text-sm">chat</span>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleEmail(c)}
                      className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition-all hover:bg-[var(--store-surface-container-low)]"
                      style={{
                        borderColor: "var(--store-outline-variant)",
                        color: "var(--store-on-surface)",
                      }}
                    >
                      <span className="material-symbols-outlined text-sm">email</span>
                      Correo
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(c)}
                      className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition-all hover:bg-[var(--store-surface-container-low)]"
                      style={{
                        borderColor: "var(--store-outline-variant)",
                        color: "var(--store-on-surface)",
                      }}
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      PDF
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.numero)}
                      className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition-all hover:bg-red-50 ml-auto"
                      style={{
                        borderColor: "#fca5a5",
                        color: "#ef4444",
                      }}
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
