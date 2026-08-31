"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/tailgrids/core/button";

/* ------------------------------------------------------------------ */
/*  Formulario de login admin. Envía a /api/admin/auth/login y en      */
/*  caso de éxito redirige al dashboard (recarga completa para que el  */
/*  proxy/header reflejen la nueva sesión).                             */
/* ------------------------------------------------------------------ */

export function AdminLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const usuario = String(formData.get("usuario") ?? "").trim();
    const contrasena = String(formData.get("contrasena") ?? "");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena }),
      });

      if (res.ok) {
        window.location.assign("/admin");
        return;
      }

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "No se pudo iniciar sesión. Inténtalo de nuevo.");
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-badge-error-background px-4 py-3 text-sm font-medium text-badge-error-text"
          data-testid="admin-login-error"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-usuario"
          className="text-xs font-semibold uppercase tracking-wide text-text-secondary"
        >
          Usuario
        </label>
        <input
          id="admin-usuario"
          name="usuario"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-card-border bg-background-white-primary px-4 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-input-placeholder-text focus:border-input-primary-focus-border"
          placeholder="usuario"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-contrasena"
          className="text-xs font-semibold uppercase tracking-wide text-text-secondary"
        >
          Contraseña
        </label>
        <input
          id="admin-contrasena"
          name="contrasena"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-card-border bg-background-white-primary px-4 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-input-placeholder-text focus:border-input-primary-focus-border"
          placeholder="••••••••"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        appearance="fill"
        size="lg"
        isDisabled={isSubmitting}
        className="mt-2 w-full"
      >
        {isSubmitting ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}