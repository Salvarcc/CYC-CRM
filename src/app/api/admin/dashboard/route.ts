import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { getDashboardGeneral, getRecentQuotes } from "@/lib/dashboard";

/* ------------------------------------------------------------------ */
/*  GET — Métricas del dashboard admin (inventario, cotizaciones, etc.) */
/*  Delega en getters cacheados (src/lib/dashboard.ts). La verificación */
/*  de sesión admin y el gate quedan fuera del cache.                   */
/* ------------------------------------------------------------------ */

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const [general, recentQuotes] = await Promise.all([
    getDashboardGeneral(),
    getRecentQuotes(),
  ]);

  return NextResponse.json({ ...general, recentQuotes });
}