import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";

/* ------------------------------------------------------------------ */
/*  GET — Estado de la sesión admin (para el frontend cliente).        */
/* ------------------------------------------------------------------ */

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      id: session.sub,
      usuario: session.usuario,
      nombre: session.nombre,
    },
  });
}