import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { AdminLoginForm } from "./admin-login-form";

/* ------------------------------------------------------------------ */
/*  /admin/login — Acceso administrativo del ERP CyM.                  */
/*  Pantalla completa, SIN la navegación del área admin (vive en       */
/*  (without-layouts) para no exponer el panel a quien aún no inicia   */
/*  sesión). Si ya hay sesión válida, se redirige al dashboard.        */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: { absolute: "Acceso Administrativo | ERP CyM" },
};

const capabilities = [
  { icon: "inventory_2", label: "Control de inventario" },
  { icon: "request_quote", label: "Cotizaciones rápidas" },
  { icon: "groups", label: "Gestión de clientes" },
  { icon: "payments", label: "Reportes de ventas" },
];

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-svh overflow-y-auto bg-background-gray-secondary_alt_2">
      {/* ── Panel de marca (desktop) ─────────────────────────────── */}
      <div className="relative hidden w-1/2 overflow-hidden bg-primary-700 p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-primary-900/60"
        />

        <div className="relative flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-primary-text">
            admin_panel_settings
          </span>
          <div>
            <p className="text-2xl font-semibold text-primary-text">ERP CyM</p>
            <p className="text-sm text-primary-100">CyM Computadoras e Ingeniería</p>
          </div>
        </div>

        <div className="relative mt-10">
          <h1 className="max-w-md text-3xl font-semibold leading-tight text-primary-text">
            Gestión centralizada de tu negocio
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-100">
            Este panel es de uso exclusivo del personal autorizado de CyM.
            Inicia sesión para continuar.
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-3">
          {capabilities.map((cap) => (
            <div
              key={cap.label}
              className="flex items-center gap-2.5 rounded-xl bg-white/10 px-4 py-3"
            >
              <span className="material-symbols-outlined text-lg text-primary-text">
                {cap.icon}
              </span>
              <span className="text-sm font-medium text-primary-text">{cap.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Formulario de acceso ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-2 text-center lg:hidden">
            <span className="material-symbols-outlined text-4xl text-primary-600">
              admin_panel_settings
            </span>
            <h2 className="text-2xl font-semibold text-text-primary">ERP CyM</h2>
            <p className="text-sm text-text-tertiary">CyM Computadoras e Ingeniería</p>
          </div>

          <div className="rounded-2xl border border-card-border bg-card-surface-area p-6 shadow-[0_3px_6px_-2px_rgba(0,0,0,0.02),0_1px_1px_0_rgba(0,0,0,0.04)] md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-text-primary">Iniciar sesión</h2>
              <p className="mt-1 text-sm text-text-tertiary">
                Acceso administrativo — solo personal autorizado.
              </p>
            </div>

            <AdminLoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-text-tertiary">
            ¿No eres personal interno?{" "}
            <Link
              href="/tienda"
              className="font-medium text-primary-700 transition-colors hover:text-primary-800 hover:underline"
            >
              Volver a la tienda
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}