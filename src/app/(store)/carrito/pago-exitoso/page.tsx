"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/utils/currency";

interface VentaResult {
  id: string;
  numero: string;
  estado: string;
  totalUsd: number;
  createdAt: string;
  items: { nombre: string; marca: string; precioUsd: number; qty: number }[];
}

function PagoExitosoContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const { clearCart } = useCart();

  const [venta, setVenta] = useState<VentaResult | null>(null);
  const [checking, setChecking] = useState(true);
  const attempts = useRef(0);
  const cleared = useRef(false);

  const fetchVenta = useCallback(async () => {
    if (!sessionId) {
      setChecking(false);
      return;
    }
    try {
      const res = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.venta) {
          setVenta(data.venta);
          setChecking(false);
          return true;
        }
      }
    } catch {
      // reintenta
    }
    return false;
  }, [sessionId]);

  useEffect(() => {
    if (!cleared.current) {
      clearCart();
      cleared.current = true;
    }
    if (!sessionId) return;

    // El webhook puede tardar unos segundos: reintenta varias veces.
    const interval = setInterval(async () => {
      attempts.current += 1;
      if (attempts.current > 8) {
        clearInterval(interval);
        setChecking(false);
        return;
      }
      const found = await fetchVenta();
      if (found) clearInterval(interval);
    }, 1500);
    return () => clearInterval(interval);
  }, [fetchVenta, clearCart, sessionId]);

  const totalUsd = venta?.totalUsd ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
      <span
        className="material-symbols-outlined text-7xl"
        style={{ color: "var(--store-primary)" }}
      >
        check_circle
      </span>
      <h1
        className="text-3xl font-bold"
        style={{ color: "var(--store-on-surface)" }}
      >
        ¡Gracias por tu compra!
      </h1>

      {!sessionId ? (
        <p
          className="text-sm"
          style={{ color: "var(--store-on-surface-variant)" }}
        >
          No encontramos la sesión de pago. Vuelve a intentarlo desde tu carrito.
        </p>
      ) : checking && !venta ? (
        <p
          className="text-sm"
          style={{ color: "var(--store-on-surface-variant)" }}
        >
          Estamos confirmando tu pago...
        </p>
      ) : venta ? (
        <div
          className="w-full rounded-xl p-6 text-left ambient-shadow"
          style={{
            backgroundColor: "var(--store-surface-container-lowest)",
            border: "1px solid var(--store-outline-variant)",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              Pedido
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: "var(--store-primary)" }}
            >
              {venta.numero}
            </span>
          </div>

          <ul className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: "var(--store-outline-variant)" }}>
            {venta.items.map((item, idx) => (
              <li key={`${item.nombre}-${idx}`} className="flex justify-between gap-4 text-sm">
                <span style={{ color: "var(--store-on-surface)" }}>
                  {item.qty} × {item.nombre}
                  {item.marca ? ` (${item.marca})` : ""}
                </span>
                <span className="font-semibold" style={{ color: "var(--store-on-surface-variant)" }}>
                  {formatPrice(item.precioUsd * item.qty, "USD")}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between border-t pt-3" style={{ borderColor: "var(--store-outline-variant)" }}>
            <span className="font-bold" style={{ color: "var(--store-on-surface)" }}>
              Total pagado
            </span>
            <span className="text-lg font-bold" style={{ color: "var(--store-primary)" }}>
              {formatPrice(totalUsd, "USD")}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p
            className="text-sm"
            style={{ color: "var(--store-on-surface-variant)" }}
          >
            Tu pago fue registrado y estamos procesando el pedido.
          </p>
          <button
            onClick={() => {
              setChecking(true);
              attempts.current = 0;
              void fetchVenta();
            }}
            className="rounded-lg px-6 py-2 text-sm font-semibold transition-all hover:scale-95"
            style={{
              backgroundColor: "var(--store-primary)",
              color: "var(--store-on-primary)",
            }}
          >
            Ver detalle del pedido
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/tienda"
          className="rounded-lg px-6 py-2 text-sm font-semibold transition-all hover:scale-95"
          style={{
            backgroundColor: "var(--store-primary)",
            color: "var(--store-on-primary)",
          }}
        >
          Seguir comprando
        </Link>
        <Link
          href="/cotizaciones"
          className="rounded-lg border px-6 py-2 text-sm font-semibold transition-all hover:bg-[var(--store-surface-container-low)]"
          style={{
            borderColor: "var(--store-outline-variant)",
            color: "var(--store-primary)",
          }}
        >
          Mis cotizaciones
        </Link>
      </div>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense fallback={null}>
      <PagoExitosoContent />
    </Suspense>
  );
}