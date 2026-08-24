"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";

import { AuthButton } from "@/components/common/auth-button";
import { CartProvider, useCart } from "@/hooks/use-cart";
import { CurrencyProvider, useCurrency } from "@/hooks/use-currency";
import "../css/store.css";

function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <button
      onClick={() => setCurrency(currency === "USD" ? "PEN" : "USD")}
      className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-all hover:scale-95"
      style={{
        borderColor: "var(--store-outline-variant)",
        color: "var(--store-on-surface)",
        backgroundColor: "var(--store-surface-container-low)",
      }}
      title="Cambiar moneda"
    >
      <span className="material-symbols-outlined text-sm">currency_exchange</span>
      {currency}
    </button>
  );
}

function CartButton() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/carrito"
      className="relative transition-colors"
      style={{ color: "var(--store-on-surface-variant)" }}
    >
      <span className="material-symbols-outlined">shopping_cart</span>
      {totalItems > 0 && (
        <span
          className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none"
          style={{
            backgroundColor: "var(--store-primary)",
            color: "var(--store-on-primary)",
          }}
        >
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}

function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  /* ── Limpieza de configuración al salir ──────────────────────
     La configuración del PC solo debe persistir mientras el usuario
     esté en /configurador o /cotizacion. Si navega a cualquier otra
     página (tienda, carrito, etc.) se elimina del localStorage.    */
  useEffect(() => {
    if (pathname !== "/configurador" && pathname !== "/cotizacion") {
      localStorage.removeItem("cym-configuracion");
    }
  }, [pathname]);

  return (
    <div className="store-root">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 w-full border-b shadow-sm"
        style={{
          backgroundColor: "var(--store-surface-container-lowest)",
          borderColor: "var(--store-outline-variant)",
        }}
      >
        <div className="mx-auto flex h-20 w-full items-center justify-between px-4 md:px-8">
          {/* Brand */}
          <Link href="/tienda" className="flex items-center gap-4">
            <img
              alt="CyM Computadoras"
              className="h-12 object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBL2oJgN7wZ1qS42ieEyDyhZruYbZ0vS39voPvete9dCVfscrG1jIEdrUZP9fCUO-o_iAn6n7ARoZHS7T7RXRTOMqMvYS-IdlBeU6dO29wYkkAp5aCQMep-eCVDOCwu0b53d8e613ipi2MlijJUWhrO8odsBw28ENCoQTLm5iLMPyqMH0CV_p-2gpy4qreApY-0HFORQHg5jNueyQrVACavX2HxXulMqEvg2i1p9276fnyF4IpvfIz2rgrhmZLeJ8SpRw"
            />
          </Link>

          {/* Nav Links (Desktop) */}
          <div className="hidden items-center gap-8 md:flex">
            {[
              { href: "/tienda", label: "Tienda" },
              { href: "/tienda", label: "Promociones" },
              { href: "/tienda", label: "Nosotros" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="pb-1 text-sm font-semibold uppercase tracking-wide transition-colors"
                style={{
                  color:
                    item.label === "Tienda"
                      ? "var(--store-primary)"
                      : "var(--store-on-surface-variant)",
                  borderBottom:
                    item.label === "Tienda"
                      ? "2px solid var(--store-primary)"
                      : "2px solid transparent",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <CurrencySwitcher />
            <Link
              href="/configurador"
              className="hidden rounded-lg px-6 py-2 text-sm font-semibold transition-all hover:scale-95 md:block"
              style={{
                backgroundColor: "var(--store-primary)",
                color: "var(--store-on-primary)",
              }}
            >
              Cotiza tu PC
            </Link>
            <CartButton />
            <AuthButton />
            <button
              className="transition-colors md:hidden"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page Content ───────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer
        className="w-full border-t"
        style={{
          backgroundColor: "var(--store-surface-container-highest)",
          borderColor: "var(--store-outline-variant)",
        }}
      >
        <div className="mx-auto grid w-full grid-cols-1 gap-6 px-4 py-10 md:grid-cols-2 md:px-8">
          <div>
            <p
              className="mb-2 text-base font-bold"
              style={{ color: "var(--store-on-surface)" }}
            >
              CyM Computadoras e Ingeniería
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              Jr. Francisco Pizarro 154 - Centro Histórico, Trujillo, Peru,
              13001
            </p>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              &copy; 2024 CyM Computadoras e Ingeniería. Todos los derechos
              reservados.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 md:justify-end">
            {[
              "Términos y Condiciones",
              "Políticas de Garantía",
              "Libro de Reclamaciones",
              "Contacto",
            ].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-semibold transition-all hover:underline"
                style={{ color: "var(--store-on-surface-variant)" }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        <CartProvider>
          <StoreShell>{children}</StoreShell>
        </CartProvider>
      </CurrencyProvider>
    </SessionProvider>
  );
}
