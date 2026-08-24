"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface RegistroState {
  error?: string;
  ok?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registrarCliente(
  _prevState: RegistroState,
  formData: FormData,
): Promise<RegistroState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const correo = String(formData.get("correo") ?? "").trim().toLowerCase();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const contrasena = String(formData.get("contrasena") ?? "");

  if (!nombre || !correo || !telefono || !contrasena) {
    return { error: "Completa todos los campos para crear tu cuenta." };
  }
  if (nombre.length < 3) {
    return { error: "El nombre debe tener al menos 3 caracteres." };
  }
  if (!EMAIL_RE.test(correo)) {
    return { error: "Ingresa un correo electrónico válido." };
  }
  const soloDigitos = telefono.replace(/\D/g, "");
  if (soloDigitos.length < 6 || soloDigitos.length > 15) {
    return { error: "Ingresa un número de teléfono válido." };
  }
  if (contrasena.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const existente = await prisma.cliente.findUnique({ where: { correo } });
  if (existente) {
    return { error: "Ya existe una cuenta registrada con este correo." };
  }

  const passwordHash = await bcrypt.hash(contrasena, 10);

  try {
    await prisma.cliente.create({
      data: { nombre, correo, telefono, passwordHash },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { error: "Ya existe una cuenta registrada con este correo." };
    }
    return { error: "Ocurrió un error al crear tu cuenta. Inténtalo de nuevo." };
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
      return {
        error:
          "Tu cuenta fue creada pero no pudimos iniciar sesión automáticamente. Inicia sesión manualmente.",
      };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          "Tu cuenta fue creada pero no pudimos iniciar sesión automáticamente. Inicia sesión manualmente.",
      };
    }
    throw error;
  }

  return { ok: true };
}
