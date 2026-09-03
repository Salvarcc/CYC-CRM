# CYC-CRM / CYM Computer — Explicación Detallada del Código (`CODIGO.md`)

Este documento es una **guía técnica y educativa** que analiza los archivos y funciones más importantes del proyecto, mostrando los **bloques reales de código** y explicando **línea por línea** qué hace cada instrucción, por qué se diseñó de esa manera y cómo usarlo.

---

## Índice

1. [Middleware de Seguridad: `src/proxy.ts`](#1-middleware-de-seguridad-srcproxyts)
2. [Criptografía y Sesión Administrativa: `src/lib/admin-auth.ts`](#2-criptografía-y-sesión-administrativa-srclibadmin-authts)
3. [Conexión a Neon PostgreSQL: `src/lib/prisma.ts`](#3-conexión-a-neon-postgresql-srclibprismats)
4. [Lógica de Ventas y Descuento de Stock: `src/lib/ventas.ts`](#4-lógica-de-ventas-y-descuento-de-stock-srclibventasts)
5. [Integración con Stripe: Checkout (`/api/checkout`) y Webhook (`/api/stripe/webhook`)](#5-integración-con-stripe-checkout-y-webhook)
6. [Motor de Compatibilidad del PC Builder: `src/app/(store)/configurador/page.tsx`](#6-motor-de-compatibilidad-del-pc-builder)
7. [Limpieza Automatizada de Cotizaciones: `/api/cron/cleanup-cotizaciones`](#7-limpieza-automatizada-de-cotizaciones)
8. [Subida de Imágenes a Cloudinary: `/api/upload`](#8-subida-de-imágenes-a-cloudinary)

---

## 1. Middleware de Seguridad: `src/proxy.ts`

En Next.js 16, este archivo actúa como el **Proxy/Middleware** global que intercepta cada solicitud HTTP antes de que llegue a las páginas o componentes.

### Código Fuente Real:
```typescript
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  isAdminLoginPath,
  isAdminPath,
  verifyAdminToken,
} from "@/lib/admin-auth";

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
```

### Explicación Línea por Línea:

* **Líneas 1-7**: Importa `NextRequest` y `NextResponse` de Next.js, junto con los helpers de autenticación de admin (`ADMIN_COOKIE`, `verifyAdminToken`, etc.).
* **Línea 9**: `export async function proxy(request: NextRequest)`: Función que Next.js ejecuta en cada petición HTTP coincidente con el `matcher`.
* **Líneas 10-11**:
  * `const { pathname } = request.nextUrl`: Obtiene la ruta actual solicitada por el usuario (ej. `/admin/inventario` o `/tienda`).
  * `const token = request.cookies.get(ADMIN_COOKIE)?.value`: Lee el valor de la cookie segura `cym.admin.session`. Si no existe, es `undefined`.
* **Línea 14**: `if (isAdminPath(pathname))`: Verifica si la ruta solicitada pertenece al ERP (inicia con `/admin`).
* **Línea 15**: `const session = token ? await verifyAdminToken(token) : null`: Si hay token en la cookie, lo valida criptográficamente (firma HMAC y fecha de expiración). Si no es válido o no hay token, `session` es `null`.
* **Líneas 17-22**:
  * Si la ruta es `/admin/login` (`isAdminLoginPath`) y el usuario **ya tiene sesión válida**, no tiene sentido mostrarle el formulario de login: lo redirige automáticamente a `/admin`.
  * Si no tiene sesión, `return NextResponse.next()` le permite ver la pantalla de login.
* **Líneas 24-31**:
  * Si el usuario quiere entrar a cualquier otra pantalla del ERP (`/admin/inventario`, `/admin/ventas`, etc.) y `!session` (no está autenticado o su token expiró):
  * Lo redirige inmediatamente a `/admin/login`.
  * `response.cookies.delete(ADMIN_COOKIE)`: Limpia cualquier cookie previa que estuviera corrupta o expirada.
* **Líneas 35-40 (Regla de seguridad estricta)**:
  * Si el usuario está navegando **fuera de `/admin`** (por ejemplo en `/tienda` o `/configurador`) y aún tiene la cookie `token`:
  * El middleware **elimina la cookie** inmediatamente (`response.cookies.delete(ADMIN_COOKIE)`).
  * **Propósito**: Garantizar que la sesión de administrador solo exista mientras se esté dentro del ERP. Si un operador se va a la tienda o se distrae, la sesión administrativa no queda expuesta en la máquina.
* **Líneas 44-48 (`config.matcher`)**:
  * Expresión regular que excluye archivos estáticos (`_next/static`, imágenes `.png`, `.webp`, `.svg`, fuentes tipográficas) y las rutas `/api/*` (las APIs validan su sesión de forma independiente para no penalizar latencia).

---

## 2. Criptografía y Sesión Administrativa: `src/lib/admin-auth.ts`

En lugar de usar librerías externas pesadas (como `jsonwebtoken` que dependen de Node.js `crypto` clásico), este módulo utiliza la **Web Crypto API nativa (`crypto.subtle`)**, lo cual funciona tanto en Node.js como en entornos Edge Serverless.

### Código Clave: Firma y Verificación de Tokens
```typescript
const HMAC_ALGO = { name: "HMAC", hash: "SHA-256" } as const;

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

export async function signAdminToken(payload: AdminSessionPayload): Promise<string> {
  const encoded = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(),
    new TextEncoder().encode(encoded),
  );
  return `${encoded}.${b64urlEncode(new Uint8Array(signature))}`;
}

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
    if (payload.exp * 1000 < Date.now()) return null; // Expirado
    return payload;
  } catch {
    return null;
  }
}
```

### Explicación Línea por Línea:

* `getSigningKey()`: Convierte la clave secreta `AUTH_SECRET` (definida en el archivo `.env`) en una clave binaria `CryptoKey` optimizada en memoria (`cachedKey`).
* `signAdminToken(payload)`:
  1. Convierte el objeto JavaScript `{ sub, usuario, exp, ... }` a texto JSON y lo codifica en base64 seguro para URL (`b64urlEncode`).
  2. Ejecuta `crypto.subtle.sign("HMAC", ...)` para generar la firma digital binaria.
  3. Une ambas partes separadas por un punto: `payloadCodificado.firma`.
* `verifyAdminToken(token)`:
  1. Separa el token en sus dos componentes mediante `token.lastIndexOf(".")`.
  2. Llama a `crypto.subtle.verify(...)`. Si alguien intentó alterar el contenido del payload (por ejemplo, cambiar el ID del usuario), la función devuelve `false`.
  3. Comprueba `payload.exp * 1000 < Date.now()`: Si la fecha actual superó el tiempo de vida (12 horas), el token se rechaza como vencido.

---

## 3. Conexión a Neon PostgreSQL: `src/lib/prisma.ts`

Next.js en modo desarrollo recarga los archivos con cada guardado (Hot Module Replacement). Si se inicializara `new PrismaClient()` directamente en el archivo, se crearían cientos de conexiones a PostgreSQL hasta agotar el límite de Neon.

### Código Fuente Real:
```typescript
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Explicación Línea por Línea:

* **Línea 1**: `import { PrismaClient } from "@/generated/prisma/client"`: Importa el cliente generado específicamente por Prisma 7 según [prisma/schema.prisma](file:///c:/Users/USUARIO.DESKTOP-I3J2EQD/OneDrive/Documentos/Web-Archives/CYC-CRM/prisma/schema.prisma).
* **Línea 2**: `import { PrismaPg } from "@prisma/adapter-pg"`: En Prisma 7, PostgreSQL requiere un driver adapter nativo que gestiona las conexiones sobre Neon Serverless.
* **Líneas 4-6**: `globalForPrisma`: Accede al objeto global de JavaScript (`globalThis`) donde la conexión persistirá entre recargas de código en desarrollo.
* **Líneas 8-13 (`createPrismaClient`)**:
  * Instancia el adaptador `PrismaPg` pasando la variable `process.env.DATABASE_URL`.
  * Retorna una nueva instancia de `PrismaClient({ adapter })`.
* **Línea 15**: `export const prisma = globalForPrisma.prisma ?? createPrismaClient()`: Patrón Singleton: si ya existe una conexión en `globalThis`, la reutiliza; si no existe, crea una nueva.
* **Línea 17**: `if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma`: En entorno local guarda la instancia en `globalThis` para evitar saturar conexiones.

---

## 4. Lógica de Ventas y Descuento de Stock: `src/lib/ventas.ts`

Gestiona la validación del carrito, el cálculo de totales en centavos para Stripe y el descuento atómico de existencias.

### Código Clave: Descuento Seguro de Stock
```typescript
export async function decrementStocks(
  entries: StockEntry[],
  map: Record<string, ProductDelegate> = MODEL_MAP,
): Promise<void> {
  for (const entry of entries) {
    const delegate = map[entry.categoryKey];
    if (!delegate) continue;
    await delegate.updateMany({
      where: { id: entry.productId, stock: { gte: entry.qty } },
      data: { stock: { decrement: entry.qty } },
    });
  }
}
```

### Explicación Línea por Línea:
* `entries: StockEntry[]`: Lista con `{ categoryKey: "cpu", productId: "cm...", qty: 1 }`.
* `map[entry.categoryKey]`: Elige la tabla correcta (`prisma.cpu`, `prisma.gpu`, `prisma.psu`, etc.) según la categoría del producto.
* `where: { id: entry.productId, stock: { gte: entry.qty } }`: **Guardia de seguridad**. Solo ejecuta el descuento si el stock en la base de datos es mayor o igual (`gte`) a la cantidad que se quiere descontar.
* `data: { stock: { decrement: entry.qty } }`: Ejecuta una operación SQL nativa `stock = stock - qty`. Esto es **atómico** y evita condiciones de carrera cuando dos clientes compran el mismo producto al mismo segundo.

### Código Clave: Generador de Correlativos de Venta
```typescript
export async function generateVentaNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.venta.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });
  return `PED-${year}-${String(count + 1).padStart(4, "0")}`;
}
```
* Cuenta cuántas ventas se han registrado en el año actual (ej. 2026).
* `String(count + 1).padStart(4, "0")`: Rellena con ceros a la izquierda para generar identificadores comerciales estandarizados como `PED-2026-0001`, `PED-2026-0045`.

---

## 5. Integración con Stripe: Checkout y Webhook

### A. Crear Sesión de Pago (`src/app/api/checkout/route.ts`)
```typescript
const checkoutSession = await stripe.checkout.sessions.create({
  mode: "payment",
  customer_email: cliente.correo,
  line_items: [
    ...lines.map((line) => ({
      price_data: {
        currency: "usd",
        unit_amount: line.unitAmountCents, // Stripe exige enteros en centavos: $10.50 -> 1050
        product_data: {
          name: line.nombre,
          images: line.imagenUrl ? [line.imagenUrl] : undefined,
          metadata: productMeta(line),
        },
      },
      quantity: line.qty,
    })),
    {
      price_data: {
        currency: "usd",
        unit_amount: totals.igvCents, // Desglose explícito del 18% de IGV
        product_data: { name: "IGV (18%)" },
      },
      quantity: 1,
    },
  ],
  metadata: {
    clienteId: cliente.id,
    subtotalCents: String(totals.subtotalCents),
    igvCents: String(totals.igvCents),
    totalCents: String(totals.totalCents),
  },
  success_url: `${origin}/carrito/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/carrito?cancelado=1`,
});
```
* **Centavos**: Stripe no acepta números flotantes como `199.99` para evitar errores de redondeo de punto flotante en computadoras. Por eso `unit_amount` se multiplica por 100 (`Math.round(price * 100)`).
* `metadata`: Adjunta información interna (`clienteId`, desglose tributario) que Stripe devuelve intacta en el webhook tras el pago.

### B. Webhook Seguro e Idempotente (`src/app/api/stripe/webhook/route.ts`)
```typescript
// 1. Idempotencia: Verificar si esta sesión ya fue procesada antes
const existing = await prisma.venta.findUnique({
  where: { stripeSessionId: session.id },
});
if (existing) return; // Si ya se creó la venta, no hacer nada para no descontar stock doble

// 2. Transacción atómica: Crear venta y descontar stock
await prisma.$transaction(async (tx) => {
  await tx.venta.create({
    data: {
      numero: await generateVentaNumero(),
      clienteId: cliente.id,
      stripeSessionId: session.id,
      subtotalUsd,
      igvUsd,
      totalUsd,
      items: { create: itemsParaCrear },
    },
  });

  await decrementStocks(stockEntries, txModelMap(tx));
});
```
* **Idempotencia**: Stripe puede enviar el mismo evento webhook más de una vez si hay lentitud de red. Consultar `where: { stripeSessionId: session.id }` asegura que la venta y el descuento de stock se ejecuten **exactamente una sola vez**.
* **`prisma.$transaction`**: Garantiza que si la base de datos falla al registrar un ítem, toda la operación se revierte (rollback) y no se descontará stock incorrectamente.

---

## 6. Motor de Compatibilidad del PC Builder

Ubicado en [src/app/(store)/configurador/page.tsx](file:///c:/Users/USUARIO.DESKTOP-I3J2EQD/OneDrive/Documentos/Web-Archives/CYC-CRM/src/app/%28store%29/configurador/page.tsx), este bloque calcula qué componentes mostrar al usuario según lo que ya ha elegido:

```typescript
const compatibilityProducts = useMemo(() => {
  let list = products.filter((p) => p.categoryKey === stepDef.categoryKey);

  switch (stepKey) {
    case "motherboard":
      if (selectedCpu) {
        // La placa debe tener el mismo socket que el procesador (ej: LGA1700 o AM5)
        const cpuSocket = selectedCpu.attrs.socket as string;
        list = list.filter(
          (p) => p.stock > 0 && (p.attrs.socket as string) === cpuSocket,
        );
      }
      break;

    case "ram":
      if (selectedMotherboard) {
        // La RAM debe coincidir con DDR4 o DDR5 según la placa madre elegida
        const mbTypes = toStringArray(selectedMotherboard.attrs.tipoMemoria);
        list = list.filter(
          (p) =>
            p.stock > 0 &&
            mbTypes.includes(p.attrs.tipoMemoria as string),
        );
      }
      break;

    case "cooler":
      if (selectedCpu) {
        // El cooler debe incluir en su lista de sockets soportados el socket del CPU
        const cpuSocket = selectedCpu.attrs.socket as string;
        list = list.filter((p) => {
          const supported = toStringArray(p.attrs.socketsSoportados);
          return p.stock > 0 && supported.includes(cpuSocket);
        });
      }
      break;

    case "case":
      if (selectedMotherboard) {
        // El gabinete debe soportar el tamaño de la placa (ATX, Micro-ATX, etc.)
        const mbForm = selectedMotherboard.attrs.factorForma as string;
        list = list.filter((p) => {
          const supportedForms = toStringArray(p.attrs.soportaFactoresForma);
          return supportedForms.includes(mbForm);
        });
      }
      if (selectedGpu) {
        // La longitud de la tarjeta de video debe caber en el gabinete
        const gpuLength = toNum(selectedGpu.attrs.largoMm);
        list = list.filter((p) => toNum(p.attrs.largoMaxGpuMm) >= gpuLength);
      }
      break;
  }
  return list;
}, [stepKey, products, selectedCpu, selectedMotherboard, selectedGpu]);
```

### ¿Cómo funciona en la interfaz?
1. Si el usuario elige un procesador **Ryzen 7 7800X3D (Socket AM5)**, al pasar al paso de *Placa Madre*, el filtro descarta automáticamente placas Intel (LGA1700) o AMD antiguas (AM4), mostrando únicamente placas AM5 con stock.
2. Al seleccionar una placa **DDR5**, el paso de *Memoria RAM* oculta automáticamente cualquier módulo DDR4.
3. Si el usuario elige una tarjeta gráfica gigante de 340 mm, el paso de *Gabinete* filtra y solo muestra cajas con espacio interior suficiente (`largoMaxGpuMm >= 340`).

---

## 7. Limpieza Automatizada de Cotizaciones

Ubicado en [src/app/api/cron/cleanup-cotizaciones/route.ts](file:///c:/Users/USUARIO.DESKTOP-I3J2EQD/OneDrive/Documentos/Web-Archives/CYC-CRM/src/app/api/cron/cleanup-cotizaciones/route.ts):

```typescript
export async function GET(request: Request) {
  // 1. Proteger el endpoint con token secreto
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Calcular fecha límite: hace 3 días exactos
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // 3. Eliminar ítems de cotizaciones vencidas
    await prisma.$executeRaw`
      DELETE FROM "CotizacionItem"
      WHERE "cotizacionId" IN (
        SELECT id FROM "Cotizacion" WHERE "expiresAt" < ${cutoff}
      )
    `;

    // 4. Eliminar las cotizaciones padre
    const result = await prisma.cotizacion.deleteMany({
      where: { expiresAt: { lt: cutoff } },
    });

    return NextResponse.json({
      deleted: result.count,
      message: `Se eliminaron ${result.count} cotizaciones expiradas.`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error en cleanup" }, { status: 500 });
  }
}
```
* **Líneas 5-10**: Vercel envía automáticamente el encabezado `Authorization: Bearer <CRON_SECRET>` definido en las variables de entorno. Si un tercero intenta llamar al endpoint por navegador, recibe un `401 Unauthorized`.
* **Línea 14**: `cutoff = Date.now() - 3 días`: Las cotizaciones tienen vigencia de 3 días. Todo lo que venció antes de ese plazo se purga.
* **Líneas 16-25**: Ejecuta la eliminación en SQL crudo de los hijos (`CotizacionItem`) y luego con Prisma de los padres (`Cotizacion`), liberando almacenamiento en la base de datos de Neon.

---

## 8. Subida de Imágenes a Cloudinary

Ubicado en [src/app/api/upload/route.ts](file:///c:/Users/USUARIO.DESKTOP-I3J2EQD/OneDrive/Documentos/Web-Archives/CYC-CRM/src/app/api/upload/route.ts):

```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
  }

  // 1. Convertir el archivo web a Buffer binario de Node.js
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 2. Subir en Stream continuo a Cloudinary
  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "cym-crm/products",
          resource_type: "image",
        },
        (error, res) => {
          if (error) return reject(error);
          resolve(res as { secure_url: string; public_id: string });
        },
      );
      uploadStream.end(buffer);
    },
  );

  return NextResponse.json({
    url: result.secure_url,
    publicId: result.public_id,
  });
}
```

### Explicación:
* `await request.formData()`: Lee el archivo binario subido desde el modal de inventario del ERP.
* `Buffer.from(bytes)`: Lo convierte en memoria para enviarlo sin necesidad de guardarlo en el disco duro del servidor (vital para Vercel Serverless, donde el disco es de solo lectura).
* `cloudinary.uploader.upload_stream`: Envía el flujo de datos a la carpeta `cym-crm/products` en Cloudinary y retorna `secure_url` (ej: `https://res.cloudinary.com/.../image.webp`), la cual se almacena directamente en la base de datos.

---

## Conclusión

Este diseño garantiza:
1. **Seguridad**: Autenticación desacoplada con Web Crypto nativo y middleware que destruye sesiones fuera de su contexto.
2. **Concurrencia e Integridad**: Transacciones ACID en PostgreSQL (Neon) para cobros de Stripe y descuento de stock atómico.
3. **Escalabilidad Serverless**: Sin dependencias de estado local, arranque instantáneo y uso eficiente de cuotas gratuitas (Vercel Hobby + Neon + Cloudinary).
