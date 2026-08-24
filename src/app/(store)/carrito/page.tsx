"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useCurrency } from "@/hooks/use-currency";
import { convertPrice, formatPrice, type Currency } from "@/utils/currency";

const PLACEHOLDER_IMG =
  "https://placehold.co/400x400/f3f4f6/6b7280?text=PC+Component";

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const { currency, rate } = useCurrency();
  const [pdfLoading, setPdfLoading] = useState(false);

  function itemPrice(price: number, moneda: string): number {
    return convertPrice(price, (moneda === "PEN" ? "PEN" : "USD") as Currency, currency, rate.venta);
  }

  const subtotal = items.reduce((s, i) => s + itemPrice(i.precio, i.moneda) * i.qty, 0);
  const igv = Math.round(subtotal * 0.18);
  const total = subtotal + igv;

  /* ── PDF handler ─────────────────────────────────────────────── */

  async function handleDownloadPDF() {
    if (items.length === 0) return;
    setPdfLoading(true);
    try {
      const { generateCartPDF } = await import("@/utils/pdf");
      await generateCartPDF(items, currency, rate.venta);
    } catch (err) {
      console.error("Error generating cart PDF:", err);
    } finally {
      setPdfLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-24">
        <span
          className="material-symbols-outlined text-6xl"
          style={{ color: "var(--store-on-surface-variant)" }}
        >
          shopping_cart
        </span>
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--store-on-surface)" }}
        >
          Tu carrito está vacío
        </h2>
        <p
          className="text-sm"
          style={{ color: "var(--store-on-surface-variant)" }}
        >
          Agrega productos desde el catálogo para comenzar.
        </p>
        <Link
          href="/tienda"
          className="mt-2 rounded-lg px-6 py-2 text-sm font-semibold transition-all hover:scale-95"
          style={{
            backgroundColor: "var(--store-primary)",
            color: "var(--store-on-primary)",
          }}
        >
          Ir a la Tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full px-4 py-10 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1
          className="text-3xl font-bold"
          style={{ color: "var(--store-on-surface)" }}
        >
          Carrito de Compras
        </h1>
        <button
          onClick={clearCart}
          className="text-xs font-semibold transition-colors hover:text-[var(--store-error)]"
          style={{ color: "var(--store-on-surface-variant)" }}
        >
          Vaciar carrito
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ── Items Table ───────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div
            className="overflow-hidden rounded-xl"
            style={{
              backgroundColor: "var(--store-surface-container-lowest)",
              border: "1px solid var(--store-outline-variant)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-6 py-4"
              style={{
                backgroundColor: "var(--store-surface-container-low)",
                borderColor: "var(--store-outline-variant)",
              }}
            >
              <h2
                className="text-xl font-semibold"
                style={{ color: "var(--store-on-surface)" }}
              >
                Productos ({items.length})
              </h2>
            </div>

            {/* Items */}
            <div className="divide-y" style={{ borderColor: "var(--store-outline-variant)" }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 transition-colors hover:bg-[var(--store-surface-container-low)] md:gap-6 md:p-6"
                >
                  <div
                    className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg md:h-24 md:w-24"
                    style={{ backgroundColor: "var(--store-surface-container-low)" }}
                  >
                    <img
                      alt={item.nombre}
                      className="h-full w-full object-contain p-2"
                      src={item.imagenUrl || PLACEHOLDER_IMG}
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3
                        className="text-sm font-semibold md:text-base"
                        style={{ color: "var(--store-on-surface)" }}
                      >
                        {item.nombre}
                      </h3>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--store-on-surface-variant)" }}
                      >
                        {item.marca} · {item.category}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.qty - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded border text-xs font-bold transition-colors hover:bg-[var(--store-surface-container-low)]"
                          style={{
                            borderColor: "var(--store-outline-variant)",
                            color: "var(--store-on-surface)",
                          }}
                        >
                          −
                        </button>
                        <span
                          className="w-8 text-center text-sm font-semibold"
                          style={{ color: "var(--store-on-surface)" }}
                        >
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.qty + 1)}
                          disabled={item.qty >= 10}
                          className="flex h-7 w-7 items-center justify-center rounded border text-xs font-bold transition-colors hover:bg-[var(--store-surface-container-low)] disabled:opacity-40"
                          style={{
                            borderColor: "var(--store-outline-variant)",
                            color: "var(--store-on-surface)",
                          }}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-2 text-xs transition-colors hover:text-[var(--store-error)]"
                          style={{ color: "var(--store-on-surface-variant)" }}
                        >
                          <span className="material-symbols-outlined text-base">
                            delete
                          </span>
                        </button>
                      </div>
                      <span
                        className="text-lg font-bold"
                        style={{ color: "var(--store-primary)" }}
                      >
                        {formatPrice(itemPrice(item.precio, item.moneda) * item.qty, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Summary Sidebar ───────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Totals Card */}
          <div
            className="rounded-xl p-6 ambient-shadow"
            style={{
              backgroundColor: "var(--store-surface-container-lowest)",
              border: "1px solid var(--store-outline-variant)",
            }}
          >
            <h3
              className="mb-4 text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              Resumen del Pedido
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--store-on-surface-variant)" }}>
                  Subtotal
                </span>
                <span
                  className="font-semibold"
                  style={{ color: "var(--store-on-surface)" }}
                >
                  {formatPrice(subtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--store-on-surface-variant)" }}>
                  IGV (18%)
                </span>
                <span
                  className="font-semibold"
                  style={{ color: "var(--store-on-surface)" }}
                >
                  {formatPrice(igv, currency)}
                </span>
              </div>
              <div
                className="border-t pt-3"
                style={{ borderColor: "var(--store-outline-variant)" }}
              >
                <div className="flex justify-between">
                  <span
                    className="text-base font-bold"
                    style={{ color: "var(--store-on-surface)" }}
                  >
                    Total
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: "var(--store-primary)" }}
                  >
                    {formatPrice(total, currency)}
                  </span>
                </div>
              </div>
            </div>

            <button
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all hover:scale-95"
              style={{
                backgroundColor: "var(--store-primary)",
                color: "var(--store-on-primary)",
              }}
            >
              <span className="material-symbols-outlined text-base">
                credit_card
              </span>
              Proceder al Pago
            </button>

            <button
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-all hover:bg-[var(--store-surface-container-low)] disabled:pointer-events-none disabled:opacity-60"
              disabled={pdfLoading}
              onClick={handleDownloadPDF}
              style={{
                borderColor: "var(--store-outline-variant)",
                color: "var(--store-primary)",
              }}
            >
              <span className="material-symbols-outlined text-base">
                picture_as_pdf
              </span>
              {pdfLoading ? "Generando PDF..." : "Descargar PDF"}
            </button>
          </div>

          {/* WhatsApp CTA */}
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: "var(--store-surface-container-lowest)",
              border: "1px solid var(--store-outline-variant)",
            }}
          >
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all hover:scale-95"
              style={{
                backgroundColor: "var(--store-whatsapp)",
                color: "#ffffff",
              }}
            >
              <span className="material-symbols-outlined fill text-base">
                chat
              </span>
              Hablar con un Asesor (WhatsApp)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
