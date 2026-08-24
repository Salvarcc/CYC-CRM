"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";

import { iniciarSesion, type LoginState } from "./actions";
import { AuthError, AuthField } from "../_components/auth-fields";

const INITIAL_STATE: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(iniciarSesion, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) {
      window.location.assign("/tienda");
    }
  }, [state.ok]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AuthError message={state.error} />

      <AuthField
        autoComplete="email"
        label="Correo electrónico"
        name="correo"
        placeholder="tucorreo@ejemplo.com"
        required
        type="email"
      />

      <AuthField
        autoComplete="current-password"
        label="Contraseña"
        name="contrasena"
        placeholder="••••••••"
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
        {isPending ? "Ingresando..." : "Iniciar Sesión"}
      </button>

      <p
        className="text-center text-sm"
        style={{ color: "var(--store-on-surface-variant)" }}
      >
        ¿No tienes cuenta?{" "}
        <Link
          className="font-semibold underline-offset-2 hover:underline"
          href="/registro"
          style={{ color: "var(--store-primary)" }}
        >
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
