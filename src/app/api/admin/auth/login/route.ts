import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  createAdminSessionToken,
} from "@/lib/admin-auth";

/* ------------------------------------------------------------------ */
/*  POST — Iniciar sesión admin (ERP). Establece cookie de sesión.     */
/* ------------------------------------------------------------------ */

const DUMMY_PASSWORD_HASH = "$2b$10$SVF9./STeMaIMmLZEI9oB.vKcpKzplGjponf48yyHy1ozpcIPE9Qi";

interface LoginPayload {
  usuario?: unknown;
  contrasena?: unknown;
}

export async function POST(request: Request) {
  let body: LoginPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const usuario = typeof body.usuario === "string" ? body.usuario.trim() : "";
  const contrasena = typeof body.contrasena === "string" ? body.contrasena : "";
  if (!usuario || !contrasena) {
    return NextResponse.json({ error: "Ingresa tu usuario y contraseña." }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { usuario } });

  // Timming seguro: igualámos la carga aunque el usuario no exista.
  const hashToCompare = admin?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const passwordOk = await bcrypt.compare(contrasena, hashToCompare);

  if (!admin || !passwordOk) {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }

  const token = await createAdminSessionToken({
    sub: admin.id,
    usuario: admin.usuario,
    nombre: admin.nombre ?? admin.usuario,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, ADMIN_COOKIE_OPTIONS);
  return response;
}