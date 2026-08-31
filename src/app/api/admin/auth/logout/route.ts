import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

/* ------------------------------------------------------------------ */
/*  POST — Cerrar sesión admin. Elimina la cookie de sesión.           */
/* ------------------------------------------------------------------ */

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}