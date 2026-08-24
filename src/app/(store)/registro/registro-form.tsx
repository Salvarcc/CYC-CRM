"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";

import { registrarCliente, type RegistroState } from "./actions";
import { AuthError, AuthField } from "../_components/auth-fields";

const INITIAL_STATE: RegistroState = {};

export function RegistroForm() {
  const [state, formAction, isPending] = useActionState(registrarCliente, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) {
      window.location.assign("/tienda");
    }
  }, [state.ok]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AuthError message={state.error} />

      <AuthField
        autoComplete="name"
        label="Nombre completo"
        name="nombre"
        placeholder="Juan Pérez"
        required
        type="text"
      />

      <AuthField
        autoComplete="email"
        label="Correo electrónico"
        name="correo"
        placeholder="tucorreo@ejemplo.com"
        required
        type="email"
      />

      <AuthField
        autoComplete="tel"
        inputMode="tel"
        label="Número de teléfono"
        name="telefono"
        placeholder="999 999 999"
        required
        type="tel"
      />

      <AuthField
        autoComplete="new-password"
        label="Contraseña"
        minLength={8}
        name="contrasena"
        placeholder="Mínimo 8 caracteres"
        required
        type="password"
      />

      <button
        className="mt-2 w-full rounded-lg py-3 text-sm font-bold uppercase tracking-wide transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
        disabled={isPending}
        style={{
          backgroundColor: "var(--store-primary)",
          color: "var(--store-on-primary)",
        }}
        type="submit"
      >
        {isPending ? "Creando cuenta..." : "Crear Cuenta"}
      </button>

      <p
        className="text-center text-sm"
        style={{ color: "var(--store-on-surface-variant)" }}
      >
        ¿Ya tienes cuenta?{" "}
        <Link
          className="font-semibold underline-offset-2 hover:underline"
          href="/login"
          style={{ color: "var(--store-primary)" }}
        >
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
