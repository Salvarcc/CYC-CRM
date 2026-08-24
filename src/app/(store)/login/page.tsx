import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Iniciar Sesión | CyM Computadoras",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-lg md:p-10"
        style={{
          backgroundColor: "var(--store-surface-container-lowest)",
          border: "1px solid var(--store-outline-variant)",
        }}
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span
            className="material-symbols-outlined text-4xl"
            style={{ color: "var(--store-primary)" }}
          >
            account_circle
          </span>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--store-on-surface)" }}
          >
            Iniciar Sesión
          </h1>
          <p className="text-sm" style={{ color: "var(--store-on-surface-variant)" }}>
            Accede para ver tus cotizaciones y compras
          </p>
        </div>

        <LoginForm />
      </div>

      <Link className="sr-only" href="/tienda">
        Volver a la tienda
      </Link>
    </div>
  );
}
