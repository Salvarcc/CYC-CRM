"use client";

import { useCurrency } from "@/hooks/use-currency";
import { formatPrice } from "@/utils/currency";

const items = [
  {
    id: 1,
    name: "NVIDIA GeForce RTX 4090 Founders Edition",
    detail: "GDDR6X · 24GB · 450W TDP",
    price: 8499,
    qty: 1,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYRZT-KLw1OMsV_DONhVJ6MR7jMUiJjWarES5uWk2SHnRfnvvAaPmf1HjfCD_YawmRRrepkonIOtwGTtz4ZRISdsIOsthzbfCeLQ1GresmEKZQ3tuR_kOGFG7a7ptSf5DoCbEzoP5BrTLdMEM8S2klgsL81JF5JQBbut39I2Z_i7Ppq6wfwyKf45ZJ0cpqecLj6z-vtB1kp-omz4_Xowvam_0Agli_B6EzZ8rsCb0hVj_V-kyWG4LA",
  },
  {
    id: 2,
    name: "AMD Radeon RX 7800 XT Gaming OC",
    detail: "GDDR6 · 16GB · 263W TDP",
    price: 2699,
    qty: 1,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDbcfYfUZa8MUCg1J5SQtVFFkGmpg6B1t0q3r5osOTe16rahzVHFoKNkVb96dnnmqYjX0_0WEjqEsbCeRb-Np5Rp0NGHqMhscSu07JnDKaQa9B8leQ3VyAN3SV6nA9BuDjfKlHR9YpJWVrbvG_V99NqpIpAFPx2921fXZj4xWFzxj5dRt7zJsQR9gALYyB8v_v2yliegvsEUCzO4rgQrmu6TqoLcHhYAmhNAzBU0xQRda3wIgNCW-I_",
  },
  {
    id: 3,
    name: "ASUS TUF Gaming GeForce RTX 4070 Ti",
    detail: "GDDR6X · 12GB · 300W TDP",
    price: 4150,
    qty: 1,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAaODsjGQRlzO8NXU0Pe4YZAmQPvSW7AuZOn7Nw0ubvWxXdoTlMwhAHZfmPLvM4-6NPl-Q0-3RPRJ9jtv592GJgNgcxX86L5YP9lP8uho56ppgziNOX3Vmh_6AeYHreNCf09TK3NM7eMigORjQ5O1JyX-OK4bMGOBl2x-_Kxa53eedZU7u_AQGT4yrAM0FTG487_8g_XS58rfGBReQqPjZ0dAAsjU-khg2k6N0D5NDgPeWADtCLuEPe",
  },
];

export default function CarritoPage() {
  const { currency } = useCurrency();
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const igv = Math.round(subtotal * 0.18);
  const total = subtotal + igv;

  return (
    <div className="mx-auto w-full px-4 py-10 md:px-8">
      <h1
        className="mb-8 text-3xl font-bold"
        style={{ color: "var(--store-on-surface)" }}
      >
        Carrito de Compras
      </h1>

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
                      alt={item.name}
                      className="h-full w-full object-contain p-2"
                      src={item.image}
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3
                        className="text-sm font-semibold md:text-base"
                        style={{ color: "var(--store-on-surface)" }}
                      >
                        {item.name}
                      </h3>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--store-on-surface-variant)" }}
                      >
                        {item.detail}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
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
                          className="flex h-7 w-7 items-center justify-center rounded border text-xs font-bold transition-colors hover:bg-[var(--store-surface-container-low)]"
                          style={{
                            borderColor: "var(--store-outline-variant)",
                            color: "var(--store-on-surface)",
                          }}
                        >
                          +
                        </button>
                        <button
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
                        {formatPrice(item.price * item.qty, currency)}
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
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-all hover:bg-[var(--store-surface-container-low)]"
              style={{
                borderColor: "var(--store-outline-variant)",
                color: "var(--store-primary)",
              }}
            >
              <span className="material-symbols-outlined text-base">
                picture_as_pdf
              </span>
              Descargar PDF
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
