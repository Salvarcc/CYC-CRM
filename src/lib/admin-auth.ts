/* ------------------------------------------------------------------ */
/*  Sesión administrativa del ERP — separada del auth de compradores.   */
/*                                                                      */
/*  Token firmado con HMAC-SHA-256 usando Web Crypto (compatible con    */
/*  proxy (Edge middleware y runtime Node) y cookie HttpOnly. La cookie se */
/*  emite SIN expires/maxAge => es una "session cookie": muere al       */
/*  cerrar el navegador. El payload interno sigue llevando `exp` como   */
/*  defensa extra (12h).                                                */
/* ------------------------------------------------------------------ */

const HMAC_ALGO = { name: "HMAC", hash: "SHA-256" } as const;

export const ADMIN_COOKIE = "cym.admin.session";

/** Vigencia interna del token (defensa extra; la cookie sigue siendo de sesión). */
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

export interface AdminSessionPayload {
  sub: string; // id del Admin
  usuario: string;
  nombre: string;
  iat: number;
  exp: number;
}

let cachedKey: Promise<CryptoKey> | null = null;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET es obligatorio para la sesión administrativa (src/lib/admin-auth.ts).",
    );
  }
  return secret;
}

function getSigningKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    cachedKey = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(getSecret()),
      HMAC_ALGO,
      false,
      ["sign", "verify"],
    );
  }
  return cachedKey;
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((byte) => {
    bin += String.fromCharCode(byte);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(input: string): Uint8Array<ArrayBuffer> {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/** Firma un payload y devuelve `header.payload.signature` (formato JWS compacto). */
export async function signAdminToken(payload: AdminSessionPayload): Promise<string> {
  const encoded = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(),
    new TextEncoder().encode(encoded),
  );
  return `${encoded}.${b64urlEncode(new Uint8Array(signature))}`;
}

/** Verifica firma y expiración. Devuelve el payload o null. */
export async function verifyAdminToken(token: string): Promise<AdminSessionPayload | null> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!encoded || !signature) return null;

  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await getSigningKey(),
      b64urlDecode(signature),
      new TextEncoder().encode(encoded),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(encoded)),
    ) as AdminSessionPayload;
    if (!payload?.sub || typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Construye el valor del token (payload con iat/exp) para guardar en la cookie. */
export async function createAdminSessionToken(
  payload: Pick<AdminSessionPayload, "sub" | "usuario" | "nombre">,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return signAdminToken({
    ...payload,
    iat: now,
    exp: now + ADMIN_SESSION_TTL_SECONDS,
  });
}

/** Opciones de la cookie de sesión admin (sin expires => session cookie). */
export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isAdminLoginPath(pathname: string): boolean {
  return pathname === "/admin/login";
}