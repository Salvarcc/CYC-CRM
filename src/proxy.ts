import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  isAdminLoginPath,
  isAdminPath,
  verifyAdminToken,
} from "@/lib/admin-auth";

/* ------------------------------------------------------------------ */
/*  Gate de la sesión administrativa (ERP).                            */
/*                                                                      */
/*  - /admin/* (salvo /admin/login): exige cookie de sesión admin       */
/*    válida; si no, redirige a /admin/login (limpiando cookie tóxica). */
/*  - /admin/login con sesión válida: redirige a /admin.                */
/*  - Cualquier ruta FUERA de /admin: elimina la cookie admin para que  */
/*    al volver al ERP se pida re-login (la sesión sólo vive mientras   */
/*    se navega el área administrativa).                               */
/*                                                                      */
/*  /api/* queda fuera del matcher: los route handlers verifican la     */
/*  sesión por su cuenta (getAdminSession).                             */
/* ------------------------------------------------------------------ */

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_COOKIE)?.value;

  // ── Área admin ────────────────────────────────────────────────────
  if (isAdminPath(pathname)) {
    const session = token ? await verifyAdminToken(token) : null;

    if (isAdminLoginPath(pathname)) {
      if (session) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    if (!session) {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      if (token) {
        response.cookies.delete(ADMIN_COOKIE);
      }
      return response;
    }

    return NextResponse.next();
  }

  // ── Fuera del área admin: la sesión admin muere al salir ──────────
  if (token) {
    const response = NextResponse.next();
    response.cookies.delete(ADMIN_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)",
  ],
};