import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "./admin-auth";
import type { AdminSessionPayload } from "./admin-auth";

/**
 * Lee y verifica la sesión administrativa en contexto Node (route
 * handlers, server components, server actions). Devuelve el payload o null.
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}