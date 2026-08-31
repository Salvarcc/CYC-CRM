"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

export interface LoginState {
  error?: string;
  ok?: boolean;
}

export async function iniciarSesion(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const correo = String(formData.get("correo") ?? "").trim().toLowerCase();
  const contrasena = String(formData.get("contrasena") ?? "");

  if (!correo || !contrasena) {
    return { error: "Completa todos los campos para continuar." };
  }

  try {
    const resultado = await signIn("credentials", {
      correo,
      contrasena,
      redirect: false,
    });

    if (
      resultado &&
      typeof resultado === "object" &&
      "error" in resultado &&
      resultado.error
    ) {
      return { error: "Correo o contraseña incorrectos." };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos." };
    }
    throw error;
  }

  return { ok: true };
}
