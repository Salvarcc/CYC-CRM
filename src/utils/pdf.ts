import type { Currency } from "./currency";
import { convertPrice, formatPrice } from "./currency";
import type { CartItem } from "@/hooks/use-cart";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  ConfigProduct (exportado para reuso)                               */
/* ------------------------------------------------------------------ */

export interface ConfigProduct {
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

interface StepMeta {
  label: string;
  icon: string;
  color: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEP_META: Record<string, StepMeta> = {
  cpu: { label: "Procesador (CPU)", icon: "memory", color: "#b7131a" },
  motherboard: { label: "Placa Madre", icon: "developer_board", color: "#00658d" },
  ram: { label: "Memoria RAM", icon: "dns", color: "#515c71" },
  gpu: { label: "Tarjeta de Video", icon: "waves", color: "#7c3aed" },
  cooler: { label: "Refrigeración", icon: "ac_unit", color: "#0ea5e9" },
  case: { label: "Gabinete", icon: "desktop_windows", color: "#d97706" },
  psu: { label: "Fuente de Poder", icon: "power", color: "#059669" },
};

const STEP_ORDER = [
  "cpu", "motherboard", "ram", "gpu", "cooler", "case", "psu",
] as const;

const EXTRA_ORDER = ["ssd", "monitor"] as const;

const EXTRA_META: Record<string, StepMeta> = {
  ssd: { label: "SSD / Almacenamiento", icon: "storage", color: "#1d4ed8" },
  monitor: { label: "Monitor", icon: "monitor", color: "#7c3aed" },
};

const CYM_LOGO_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBL2oJgN7wZ1qS42ieEyDyhZruYbZ0vS39voPvete9dCVfscrG1jIEdrUZP9fCUO-o_iAn6n7ARoZHS7T7RXRTOMqMvYS-IdlBeU6dO29wYkkAp5aCQMep-eCVDOCwu0b53d8e613ipi2MlijJUWhrO8odsBw28ENCoQTLm5iLMPyqMH0CV_p-2gpy4qreApY-0HFORQHg5jNueyQrVACavX2HxXulMqEvg2i1p9276fnyF4IpvfIz2rgrhmZLeJ8SpRw";

const CYM_RED_RGB: [number, number, number] = [183, 19, 26];

const PAGE_MARGIN = 15;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function loadImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function generateQuotationId(timestamp: string): string {
  const d = new Date(timestamp);
  return `#CYM-${d.getFullYear()}-${String(d.getTime() % 10000).padStart(4, "0")}`;
}

function toPreferred(price: number | null, moneda: string, currency: Currency, saleRate: number): number {
  return convertPrice(
    price ?? 0,
    (moneda === "PEN" ? "PEN" : "USD") as Currency,
    currency,
    saleRate,
  );
}

/* ── Shared drawing blocks ─────────────────────────────────────────── */

/** Logo + datos de empresa + línea separadora. Devuelve la Y donde inicia el contenido. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function drawLetterhead(doc: any, pageW: number): Promise<number> {
  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await loadImageAsBase64(CYM_LOGO_URL);
  } catch {
    /* logo failed to load, continue without it */
  }

  const margin = PAGE_MARGIN;
  let y = margin;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", margin, y, 28, 14);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...CYM_RED_RGB);
  doc.text("CyM Computadoras", pageW - margin, y + 6, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("e Ingeniería S.A.C.", pageW - margin, y + 11, { align: "right" });
  doc.text("Jr. Francisco Pizarro 154 — Trujillo, La Libertad", pageW - margin, y + 15, { align: "right" });
  doc.text("RUC: 20609568543", pageW - margin, y + 19, { align: "right" });

  y += 26;

  doc.setDrawColor(...CYM_RED_RGB);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);

  return y + 8;
}

/** Título del documento + ID + fecha alineados a la derecha. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawDocumentTitle(doc: any, pageW: number, y: number, title: string, qId: string, fecha: Date): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(title, PAGE_MARGIN, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`ID: ${qId}`, pageW - PAGE_MARGIN, y - 2, { align: "right" });
  doc.text(
    `Fecha: ${fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })}`,
    pageW - PAGE_MARGIN,
    y + 4,
    { align: "right" },
  );

  return y + 10;
}

/** Caja de totales (Subtotal / IGV / TOTAL). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawTotalsBox(doc: any, pageW: number, y: number, subtotal: number, igv: number, total: number, currency: Currency): number {
  const margin = PAGE_MARGIN;
  const totalsX = pageW - margin - 70;
  const totalsW = 70;

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(totalsX, y, totalsW, 32, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);

  doc.text("Subtotal:", totalsX + 4, y + 8);
  doc.text(formatPrice(subtotal, currency), totalsX + totalsW - 4, y + 8, { align: "right" });

  doc.text("IGV (18%):", totalsX + 4, y + 15);
  doc.text(formatPrice(igv, currency), totalsX + totalsW - 4, y + 15, { align: "right" });

  doc.setDrawColor(...CYM_RED_RGB);
  doc.setLineWidth(0.3);
  doc.line(totalsX + 4, y + 19, totalsX + totalsW - 4, y + 19);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...CYM_RED_RGB);
  doc.text("TOTAL:", totalsX + 4, y + 27);
  doc.text(formatPrice(total, currency), totalsX + totalsW - 4, y + 27, { align: "right" });

  return y + 40;
}

/** Nota legal + pie de página con contacto. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawDisclaimerAndFooter(doc: any, pageW: number, y: number, mensajeGeneracion: string): void {
  const margin = PAGE_MARGIN;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Sujeto a disponibilidad de inventario al momento de la compra. Precios pueden variar sin previo aviso.",
    margin,
    y,
  );

  y += 10;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("📞 Jr. Francisco Pizarro 154, Trujillo — 🌐 cycomputadoras.com", margin, y + 3);
  doc.text(mensajeGeneracion, pageW - margin, y + 3, { align: "right" });
}

/* ------------------------------------------------------------------ */
/*  Quotation PDF (configurador PC)                                    */
/* ------------------------------------------------------------------ */

export async function generateQuotationPDF(
  data: ConfigData,
  currency: Currency,
  saleRate: number,
): Promise<void> {
  const [jsPDFModule, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const jsPDF = jsPDFModule.default;
  const autoTable = autoTableModule.default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = new jsPDF({ unit: "mm", format: "letter" });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = PAGE_MARGIN;

  let y = await drawLetterhead(doc, pageW);

  /* ── Title + ID + date ────────────────────────────────────────── */
  const qId = generateQuotationId(data.timestamp);
  y = drawDocumentTitle(
    doc,
    pageW,
    y,
    "Cotización de Configuración PC",
    qId,
    new Date(data.timestamp),
  );

  /* ── Components table ─────────────────────────────────────────── */
  const head = [["#", "Componente", "Marca / Detalle", "Precio"]];
  const body: string[][] = [];

  for (let i = 0; i < STEP_ORDER.length; i++) {
    const key = STEP_ORDER[i];
    const product = data.selections[key];
    if (!product) continue;
    const meta = STEP_META[key];
    body.push([
      String(i + 1),
      meta.label,
      `${product.marca} — ${product.nombre}`,
      formatPrice(toPreferred(product.precio, product.moneda, currency, saleRate), currency),
    ]);
    // Group extra RAM modules right after the main RAM row
    if (key === "ram" && data.ramExtra) {
      for (const extra of data.ramExtra) {
        if (!extra) continue;
        body.push([
          String(body.length + 1),
          STEP_META.ram.label,
          `${extra.marca} — ${extra.nombre}`,
          formatPrice(toPreferred(extra.precio, extra.moneda, currency, saleRate), currency),
        ]);
      }
    }
  }

  let rowNum = body.length + 1;
  if (data.extras) {
    for (const key of EXTRA_ORDER) {
      const product = data.extras[key];
      if (!product) continue;
      const meta = EXTRA_META[key];
      body.push([
        String(rowNum++),
        `${meta.label} (Opcional)`,
        `${product.marca} — ${product.nombre}`,
        formatPrice(toPreferred(product.precio, product.moneda, currency, saleRate), currency),
      ]);
    }
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head,
    body,
    theme: "striped",
    headStyles: {
      fillColor: [...CYM_RED_RGB],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 35, fontStyle: "bold" },
      2: { cellWidth: "auto" },
      3: { cellWidth: 30, halign: "right", fontStyle: "bold" },
    },
    didParseCell(tableData) {
      if (tableData.section === "body" && tableData.column.index === 3) {
        tableData.cell.styles.textColor = [...CYM_RED_RGB];
      }
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  /* ── System status ────────────────────────────────────────────── */
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(margin, y, pageW - margin * 2, 20, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(3, 105, 161);
  doc.text(`Consumo estimado: ~${data.totalConsumption}W`, margin + 5, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(46, 125, 50);
  doc.text("✓ Compatible para ensamblaje inmediato", margin + 5, y + 14);

  y += 26;

  /* ── Totals ───────────────────────────────────────────────────── */
  const subtotal = STEP_ORDER.reduce((sum, key) => {
    const p = data.selections[key];
    if (!p) return sum;
    return sum + toPreferred(p.precio, p.moneda, currency, saleRate);
  }, 0) + (data.ramExtra ?? []).reduce((sum, p) => {
    if (!p) return sum;
    return sum + toPreferred(p.precio, p.moneda, currency, saleRate);
  }, 0) + (data.extras ? EXTRA_ORDER.reduce((sum, key) => {
    const p = data.extras?.[key];
    if (!p) return sum;
    return sum + toPreferred(p.precio, p.moneda, currency, saleRate);
  }, 0) : 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  y = drawTotalsBox(doc, pageW, y, subtotal, igv, total, currency);

  /* ── Disclaimer + Footer ──────────────────────────────────────── */
  drawDisclaimerAndFooter(
    doc,
    pageW,
    y,
    "Cotización generada automáticamente por CyM Computadoras.",
  );

  doc.save(`Cotizacion_CyM_${qId.replace(/#/g, "")}.pdf`);
}

/* ------------------------------------------------------------------ */
/*  Cart PDF (carrito de compras)                                      */
/* ------------------------------------------------------------------ */

export async function generateCartPDF(
  items: CartItem[],
  currency: Currency,
  saleRate: number,
): Promise<void> {
  const [jsPDFModule, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const jsPDF = jsPDFModule.default;
  const autoTable = autoTableModule.default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = new jsPDF({ unit: "mm", format: "letter" });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = PAGE_MARGIN;
  const timestamp = new Date().toISOString();

  let y = await drawLetterhead(doc, pageW);

  /* ── Title + ID + date ────────────────────────────────────────── */
  const orderId = generateQuotationId(timestamp);
  y = drawDocumentTitle(doc, pageW, y, "Orden de Compra — Carrito", orderId, new Date(timestamp));

  /* ── Items table ──────────────────────────────────────────────── */
  const head = [["#", "Categoría", "Marca / Producto", "Cant.", "P. Unit.", "Importe"]];
  const body: string[][] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const unitPrice = toPreferred(item.precio, item.moneda, currency, saleRate);
    body.push([
      String(i + 1),
      item.category,
      `${item.marca} — ${item.nombre}`,
      String(item.qty),
      formatPrice(unitPrice, currency),
      formatPrice(unitPrice * item.qty, currency),
    ]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head,
    body,
    theme: "striped",
    headStyles: {
      fillColor: [...CYM_RED_RGB],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 32 },
      2: { cellWidth: "auto" },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 26, halign: "right" },
      5: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
    didParseCell(tableData) {
      if (tableData.section === "body" && tableData.column.index === 5) {
        tableData.cell.styles.textColor = [...CYM_RED_RGB];
      }
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  /* ── Totals ───────────────────────────────────────────────────── */
  const subtotal = items.reduce(
    (sum, item) =>
      sum + toPreferred(item.precio, item.moneda, currency, saleRate) * item.qty,
    0,
  );
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  y = drawTotalsBox(doc, pageW, y, subtotal, igv, total, currency);

  /* ── Disclaimer + Footer ──────────────────────────────────────── */
  drawDisclaimerAndFooter(
    doc,
    pageW,
    y,
    "Orden generada automáticamente por CyM Computadoras.",
  );

  doc.save(`Orden_CyM_${orderId.replace(/#/g, "")}.pdf`);
}
