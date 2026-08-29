"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";
import { displayPrice, formatPrice, toPreferredCurrency } from "@/utils/currency";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ConfigProduct {
  id: string;
  nombre: string;
  marca: string;
  precio: number | null;
  moneda: string;
  category: string;
  categoryKey: string;
  imagenUrl: string | null;
  attrs: Record<string, unknown>;
}

interface ConfigData {
  selections: Record<string, ConfigProduct>;
  extras?: Record<string, ConfigProduct>;
  ramExtra?: (ConfigProduct | null)[];
  totalConsumption: number;
  totalPrice: number;
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEP_META: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  cpu: { label: "Procesador (CPU)", icon: "memory", color: "#b7131a" },
  motherboard: {
    label: "Placa Madre",
    icon: "developer_board",
    color: "#00658d",
  },
  ram: { label: "Memoria RAM", icon: "dns", color: "#515c71" },
  gpu: { label: "Tarjeta de Video", icon: "waves", color: "#7c3aed" },
  cooler: { label: "Refrigeración", icon: "ac_unit", color: "#0ea5e9" },
  case: { label: "Gabinete", icon: "desktop_windows", color: "#d97706" },
  psu: { label: "Fuente de Poder", icon: "power", color: "#059669" },
};

const STEP_ORDER = [
  "cpu",
  "motherboard",
  "ram",
  "gpu",
  "cooler",
  "case",
  "psu",
] as const;

const EXTRA_ORDER = ["ssd", "monitor"] as const;

const EXTRA_META: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  ssd: { label: "SSD / Almacenamiento", icon: "storage", color: "#1d4ed8" },
  monitor: { label: "Monitor", icon: "monitor", color: "#7c3aed" },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function toBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string")
    return val.toLowerCase() === "true" || val === "1";
  return false;
}

function buildSummaryLines(
  data: ConfigData,
  total: number,
  currency: "USD" | "PEN",
  rate: number,
): string[] {
  const lines: string[] = [];
  for (const key of STEP_ORDER) {
    const p = data.selections[key];
    if (!p) continue;
    const meta = STEP_META[key];
    lines.push(`${meta.label}: ${p.nombre} — ${displayPrice(p.precio, p.moneda, currency, rate)}`);
  }
  if (data.ramExtra) {
    for (const p of data.ramExtra) {
      if (!p) continue;
      lines.push(`Memoria RAM (extra): ${p.nombre} — ${displayPrice(p.precio, p.moneda, currency, rate)}`);
    }
  }
  if (data.extras) {
    for (const key of EXTRA_ORDER) {
      const p = data.extras[key];
      if (!p) continue;
      const meta = EXTRA_META[key];
      lines.push(`${meta.label} (Opcional): ${p.nombre} — ${displayPrice(p.precio, p.moneda, currency, rate)}`);
    }
  }
  lines.push("");
  lines.push(`Consumo estimado: ${data.totalConsumption}W`);
  lines.push(`Total: ${formatPrice(total, currency)}`);
  return lines;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CotizacionPage() {
  const { currency, rate } = useCurrency();
  const { data: session } = useSession();
  const [data, setData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cym-configuracion");
      if (raw) {
        setData(JSON.parse(raw));
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const totalConsumption = data?.totalConsumption ?? 0;
  /* Recompute total from selections so it follows the active currency */
  const totalPrice = useMemo(() => {
    if (!data) return 0;
    const base = STEP_ORDER.reduce((sum, k) => {
      const p = data.selections[k];
      if (!p) return sum;
      return (
        sum +
        toPreferredCurrency(p.precio ?? 0, p.moneda ?? "USD", currency, rate.venta)
      );
    }, 0);
    const extrasTotal = (data.extras ? EXTRA_ORDER : []).reduce((sum, k) => {
      const p = data.extras?.[k];
      if (!p) return sum;
      return (
        sum +
        toPreferredCurrency(p.precio ?? 0, p.moneda ?? "USD", currency, rate.venta)
      );
    }, 0);
    const ramExtraTotal = (data.ramExtra ?? []).reduce((sum, p) => {
      if (!p) return sum;
      return (
        sum +
        toPreferredCurrency(p.precio ?? 0, p.moneda ?? "USD", currency, rate.venta)
      );
    }, 0);
    return base + extrasTotal + ramExtraTotal;
  }, [data, currency, rate.venta]);
  const ramExtraItems = (data?.ramExtra ?? [])
    .map((p: ConfigProduct | null, i: number) => p && { key: `ramExtra-${i}`, ...STEP_META.ram, product: p })
    .filter(
      (x): x is { key: string; label: string; icon: string; color: string; product: ConfigProduct } =>
        !!x,
    );
  const components = data
    ? STEP_ORDER.filter((k) => data.selections[k]).reduce<
        { key: string; label: string; icon: string; color: string; product: ConfigProduct }[]
      >((acc, k) => {
        acc.push({ key: k, ...STEP_META[k], product: data.selections[k] });
        if (k === "ram") {
          // Group all extra RAM modules right after the main RAM row
          acc.push(...ramExtraItems);
        }
        return acc;
      }, [])
    : [];

  const extras = data?.extras
    ? EXTRA_ORDER.filter((k) => data.extras?.[k]).map((k) => ({
        key: k,
        ...EXTRA_META[k],
        product: data.extras![k],
      }))
    : [];

  const rows = [...components, ...extras];

  const quotationId = data?.timestamp
    ? `#CYM-${new Date(data.timestamp).getFullYear()}-${String(
        new Date(data.timestamp).getTime() % 10000,
      ).padStart(4, "0")}`
    : "#CYM-0000";

  /* ── PDF handler ────────────────────────────────────────────── */

  const [pdfLoading, setPdfLoading] = useState(false);

  async function handleDownloadPDF() {
    if (!data) return;
    setPdfLoading(true);
    try {
      const { generateQuotationPDF } = await import("@/utils/pdf");
      await generateQuotationPDF(data, currency, rate.venta);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setPdfLoading(false);
    }
  }

  /* ── WhatsApp handler ─────────────────────────────────────────── */

  function handleWhatsApp() {
    if (!data) return;
    const lines = buildSummaryLines(data, totalPrice, currency, rate.venta);
    const text = encodeURIComponent(
      `Hola, me interesa esta configuración de PC:\n\n${lines.join("\n")}\n\n¿Podrían confirmar disponibilidad y precio final?`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  /* ── Email handler ────────────────────────────────────────────── */

  function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !email) return;
    const lines = buildSummaryLines(data, totalPrice, currency, rate.venta);
    const subject = encodeURIComponent(
      `Cotización PC — ${quotationId}`,
    );
    const body = encodeURIComponent(
      `Hola,\n\nAdjunto la configuración de PC que me interesa:\n\n${lines.join("\n")}\n\nQuedo atento a su respuesta.\n\nSaludos.`,
    );
    window.open(
      `mailto:${email}?subject=${subject}&body=${body}`,
      "_blank",
    );
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  }

  /* ── Save handler ───────────────────────────────────────────── */

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selections: data.selections,
          extras: data.extras,
          ramExtra: data.ramExtra,
          totalConsumption: data.totalConsumption,
          totalPrice,
          moneda: currency,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        toast.error(err.error ?? "No se pudo guardar la cotización.");
        return;
      }

      const saved = await res.json();
      setSaved(true);
      toast.success(`Cotización ${saved.numero} guardada correctamente.`);
    } catch {
      toast.error("Error de red al guardar la cotización.");
    } finally {
      setSaving(false);
    }
  }

  /* ── Loading ──────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        style={{ color: "var(--store-on-surface-variant)" }}
      >
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

  /* ── Empty state ──────────────────────────────────────────────── */

  if (!data || components.length === 0) {
    return (
      <div
        className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center"
      >
        <span
          className="material-symbols-outlined mb-4"
          style={{ fontSize: "64px", color: "var(--store-on-surface-variant)" }}
        >
          build_circle
        </span>
        <h1
          className="mb-2 text-2xl font-bold"
          style={{ color: "var(--store-on-surface)" }}
        >
          Sin configuración
        </h1>
        <p
          className="mb-6 text-sm"
          style={{ color: "var(--store-on-surface-variant)" }}
        >
          Aún no has armado una PC. Usa el configurador para armar tu equipo y
          generar una cotización.
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
      {/* Success Banner */}
      <div
        className="mb-8 flex flex-col items-center justify-between gap-4 rounded-lg border-l-4 p-5 md:flex-row"
        style={{
          backgroundColor: "var(--store-surface-container-lowest)",
          border: "1px solid var(--store-outline-variant)",
          borderLeftColor: "var(--store-success)",
        }}
      >
        <div className="flex items-center gap-4">
          <span
            className="material-symbols-outlined fill text-4xl"
            style={{
              color: "var(--store-success)",
              fontVariationSettings: "'FILL' 1",
            }}
          >
            check_circle
          </span>
          <div>
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--store-on-surface)" }}
            >
              ¡Tu Cotización está Lista!
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              Hemos guardado tu configuración. Puedes revisarla a detalle a
              continuación.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className="mb-1 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--store-on-surface-variant)" }}
          >
            ID DE COTIZACIÓN
          </p>
          <span
            className="inline-block rounded px-3 py-1 text-sm font-bold"
            style={{
              backgroundColor: "var(--store-surface-container-low)",
              color: "var(--store-on-surface)",
            }}
          >
            {quotationId}
          </span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Components Table */}
        <div className="lg:col-span-2">
          <div
            className="flex h-full flex-col overflow-hidden rounded-lg"
            style={{
              backgroundColor: "var(--store-surface-container-lowest)",
              border: "1px solid var(--store-outline-variant)",
            }}
          >
            <div
              className="border-b px-5 py-3"
              style={{
                backgroundColor: "var(--store-surface-container-low)",
                borderColor: "var(--store-outline-variant)",
              }}
            >
              <h2
                className="text-xl font-semibold"
                style={{ color: "var(--store-on-surface)" }}
              >
                Componentes Seleccionados
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr
                    className="border-b text-xs font-bold uppercase tracking-widest"
                    style={{
                      backgroundColor: "var(--store-surface-container-low)",
                      borderColor: "var(--store-outline-variant)",
                      color: "var(--store-on-surface-variant)",
                    }}
                  >
                    <th className="px-5 py-3">Componente</th>
                    <th className="hidden px-5 py-3 md:table-cell">
                      Detalle Técnico
                    </th>
                    <th className="px-5 py-3 text-right">Precio ({currency})</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {rows.map((c, i) => (
                    <tr
                      key={c.key}
                      className="border-b transition-colors hover:bg-[var(--store-surface-container-low)]"
                      style={{
                        borderColor: "var(--store-surface-container-low)",
                        backgroundColor:
                          i % 2 === 1
                            ? "var(--store-surface-container-low)"
                            : "transparent",
                      }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="material-symbols-outlined"
                            style={{ color: c.color }}
                          >
                            {c.icon}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p
                                className="font-bold"
                                style={{ color: "var(--store-on-surface)" }}
                              >
                                {c.label}
                              </p>
                            </div>
                            <p
                              className="text-xs md:hidden"
                              style={{ color: "var(--store-on-surface-variant)" }}
                            >
                              {c.product.nombre.split(" ").slice(0, 3).join(" ")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        className="hidden px-5 py-3 md:table-cell"
                        style={{ color: "var(--store-on-surface-variant)" }}
                      >
                        <span className="font-mono text-xs">
                          {c.product.marca} — {c.product.nombre}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3 text-right font-bold"
                        style={{ color: "var(--store-on-surface)" }}
                      >
                        <span className="font-mono text-sm">
                          {displayPrice(c.product.precio, c.product.moneda, currency, rate.venta)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {/* Status Card */}
          <div
            className="rounded-lg p-5"
            style={{
              backgroundColor: "var(--store-surface-container-lowest)",
              border: "1px solid var(--store-outline-variant)",
            }}
          >
            <h3
              className="mb-3 border-b pb-2 text-xs font-bold uppercase tracking-widest"
              style={{
                color: "var(--store-on-surface-variant)",
                borderColor: "var(--store-outline-variant)",
              }}
            >
              Estado del Sistema
            </h3>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div
                className="rounded-lg p-3 text-center"
                style={{
                  backgroundColor: "var(--store-surface-container-low)",
                }}
              >
                <span
                  className="material-symbols-outlined mb-1"
                  style={{ color: "var(--store-info)" }}
                >
                  bolt
                </span>
                <p
                  className="text-xs"
                  style={{ color: "var(--store-on-surface-variant)" }}
                >
                  Consumo Est.
                </p>
                <p
                  className="font-mono text-sm font-bold"
                  style={{ color: "var(--store-on-surface)" }}
                >
                  ~{totalConsumption}W
                </p>
              </div>
              <div
                className="rounded-lg p-3 text-center"
                style={{
                  backgroundColor: "var(--store-surface-container-low)",
                }}
              >
                <span
                  className="material-symbols-outlined mb-1"
                  style={{ color: "var(--store-success)" }}
                >
                  inventory_2
                </span>
                <p
                  className="text-xs"
                  style={{ color: "var(--store-on-surface-variant)" }}
                >
                  Disponibilidad
                </p>
                <span
                  className="mt-1 inline-block rounded px-2 py-1 text-xs font-bold"
                  style={{
                    backgroundColor: "var(--store-badge-green-bg)",
                    color: "var(--store-badge-green-fg)",
                  }}
                >
                  En Stock
                </span>
              </div>
            </div>
            <div
              className="flex items-center gap-2 rounded p-2 text-xs"
              style={{
                backgroundColor: "var(--store-badge-blue-bg)",
                color: "var(--store-badge-blue-fg)",
              }}
            >
              <span className="material-symbols-outlined text-sm">info</span>
              Compatible para ensamblaje inmediato.
            </div>
          </div>

          {/* Total Card */}
          <div
            className="rounded-lg p-5"
            style={{
              backgroundColor: "var(--store-surface-container-lowest)",
              border: "1px solid var(--store-outline-variant)",
            }}
          >
            <h3
              className="mb-3 text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              Total Estimado
            </h3>
            <div className="mb-1 flex items-end gap-3">
              <span
                className="text-3xl font-bold"
                style={{ color: "var(--store-primary)" }}
              >
                {formatPrice(totalPrice, currency)}
              </span>
            </div>
            <p
              className="mb-5 text-xs"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              Sujeto a disponibilidad de inventario al momento de la compra.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleWhatsApp}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  backgroundColor: "#25D366",
                  color: "#ffffff",
                }}
              >
                <span className="material-symbols-outlined fill text-base">
                  chat
                </span>
                Enviar por WhatsApp
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-all hover:bg-[var(--store-surface-container-low)] disabled:opacity-50"
                style={{
                  borderColor: "var(--store-outline-variant)",
                  color: "var(--store-on-surface)",
                }}
              >
                <span className="material-symbols-outlined text-base">
                  {pdfLoading ? "hourglass_empty" : "download"}
                </span>
                {pdfLoading ? "Generando PDF..." : "Descargar PDF"}
              </button>
              <Link
                href="/configurador"
                className="flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-all hover:bg-[var(--store-surface-container-low)]"
                style={{
                  borderColor: "var(--store-outline-variant)",
                  color: "var(--store-on-surface)",
                }}
              >
                <span className="material-symbols-outlined text-base">
                  edit
                </span>
                Modificar Configuración
              </Link>
              {session?.user ? (
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-all hover:bg-[var(--store-surface-container-low)] disabled:opacity-50"
                  style={{
                    borderColor: saved ? "var(--store-success)" : "var(--store-outline-variant)",
                    color: saved ? "var(--store-success)" : "var(--store-on-surface)",
                  }}
                >
                  <span className="material-symbols-outlined text-base">
                    {saving ? "hourglass_empty" : saved ? "check_circle" : "bookmark_add"}
                  </span>
                  {saving ? "Guardando..." : saved ? "Cotización Guardada" : "Guardar Cotización"}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-all hover:bg-[var(--store-surface-container-low)]"
                  style={{
                    borderColor: "var(--store-outline-variant)",
                    color: "var(--store-on-surface-variant)",
                  }}
                >
                  <span className="material-symbols-outlined text-base">
                    login
                  </span>
                  Inicia sesión para guardar
                </Link>
              )}
            </div>
          </div>

          {/* Email Card */}
          <div
            className="rounded-lg p-5"
            style={{
              backgroundColor: "var(--store-surface-container-lowest)",
              border: "1px solid var(--store-outline-variant)",
            }}
          >
            <h3
              className="mb-3 text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              Enviar a mi Correo
            </h3>
            <form onSubmit={handleEmail} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="rounded-lg border p-3 text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--store-surface-container-lowest)",
                  borderColor: "var(--store-outline-variant)",
                  color: "var(--store-on-surface)",
                  ["--tw-ring-color" as string]: "var(--store-primary)40",
                }}
              />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-all hover:bg-[var(--store-surface-container-low)]"
                style={{
                  backgroundColor: "var(--store-surface-container-low)",
                  borderColor: "var(--store-outline-variant)",
                  color: "var(--store-on-surface)",
                }}
              >
                <span className="material-symbols-outlined text-base">
                  {emailSent ? "check_circle" : "send"}
                </span>
                {emailSent ? "¡Abriendo correo!" : "Enviar Cotización"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
