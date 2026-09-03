# CYC-CRM / CYM Computer — Documentación Técnica del Código (`CODIGO.md`)

Este documento explica en detalle **toda la arquitectura, módulos, funciones y flujos de datos** implementados en el proyecto. Su objetivo es servir como guía de aprendizaje y referencia técnica para entender, usar y extender el sistema.

---

## Índice

1. [Visión General del Sistema y Stack](#1-visión-general-del-sistema-y-stack)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Base de Datos y Prisma ORM](#3-base-de-datos-y-prisma-orm)
4. [Seguridad y Autenticación](#4-seguridad-y-autenticación)
   - [Proxy Middleware (`src/proxy.ts`)](#proxy-middleware-srcproxyts)
   - [Módulo de Sesión Admin (`src/lib/admin-auth.ts`)](#módulo-de-sesión-admin-srclibadmin-authts)
   - [Sesión de Clientes (NextAuth)](#sesión-de-clientes-nextauth)
5. [E-Commerce y PC Builder (Tienda Pública)](#5-e-commerce-y-pc-builder-tienda-pública)
   - [Catálogo y Filtros (`/tienda`)](#catálogo-y-filtros-tienda)
   - [Configurador de PC (`/configurador`)](#configurador-de-pc-configurador)
   - [Generación de PDF y Cotizaciones (`/cotizacion`)](#generación-de-pdf-y-cotizaciones-cotizacion)
   - [Carrito y Conversión de Moneda (`/carrito`)](#carrito-y-conversión-de-moneda-carrito)
6. [Flujo de Pagos y Ventas (Stripe + Webhook)](#6-flujo-de-pagos-y-ventas-stripe--webhook)
   - [Creación de Sesión de Pago (`/api/checkout`)](#creación-de-sesión-de-pago-apicheckout)
   - [Procesamiento del Webhook (`/api/stripe/webhook`)](#procesamiento-del-webhook-apistripewebhook)
   - [Descuento Atómico de Stock (`src/lib/ventas.ts`)](#descuento-atómico-de-stock-srclibventasts)
7. [Panel Administrativo ERP (`/admin`)](#7-panel-administrativo-erp-admin)
   - [Dashboard de KPIs](#dashboard-de-kpis)
   - [Gestión de Inventario (CRUD + CSV + Cloudinary)](#gestión-de-inventario-crud--csv--cloudinary)
   - [Gestión de Cotizaciones y Clientes](#gestión-de-cotizaciones-y-clientes)
   - [Gestión de Ventas](#gestión-de-ventas)
   - [Tipo de Cambio (USD / PEN)](#tipo-de-cambio-usd--pen)
8. [Cron Jobs y Tareas en Segundo Plano](#8-cron-jobs-y-tareas-en-segundo-plano)
9. [Guía Rápida de Comandos y Despliegue](#9-guía-rápida-de-comandos-y-despliegue)

---

## 1. Visión General del Sistema y Stack

El sistema combina una **tienda e-commerce con PC Builder interactivo** para clientes finales y un **ERP administrativo interno** para la gestión de productos, inventario, cotizaciones y ventas.

### Stack Tecnológico:
* **Frontend**: Next.js 16 (App Router), React 19, TypeScript.
* **Estilos**: Tailwind CSS v4, tokens semánticos corporativos, React Aria Components.
* **Base de Datos**: PostgreSQL Serverless (Neon) mediante Prisma ORM v7 con driver adapter `@prisma/adapter-pg`.
* **Pasarela de Pago**: Stripe Checkout (soporte para tarjetas y procesamiento de pedidos).
* **Almacenamiento de Imágenes**: Cloudinary (subida directa y optimización de URLs CDN).
* **Exportación de Documentos**: `jspdf` y `jspdf-autotable` para cotizaciones descargables en PDF.
* **Hosting**: Vercel con Vercel Cron Jobs.

---

## 2. Estructura del Proyecto

```
├── prisma/
│   ├── schema.prisma           # Modelos de base de datos relacional
│   ├── migrations/             # Historial de migraciones SQL
│   └── seed.ts                 # Script de datos iniciales
├── scripts/                    # Scripts CLI de mantenimiento y sincronización
├── src/
│   ├── app/
│   │   ├── (store)/            # Rutas públicas (tienda, configurador, carrito, login)
│   │   ├── (with-layouts)/
│   │   │   └── admin/          # Panel ERP protegido (dashboard, inventario, ventas, etc.)
│   │   └── api/                # Route Handlers REST y Webhooks
│   ├── components/             # Componentes de UI reutilizables y layout
│   ├── lib/                    # Lógica de negocio centralizada (db, stripe, auth, ventas)
│   └── proxy.ts                # Middleware de seguridad para la sesión del ERP
├── vercel.json                 # Configuración de cron jobs diarios
└── tsconfig.json               # Configuración del compilador TypeScript
```

---

## 3. Base de Datos y Prisma ORM

Toda la definición reside en [prisma/schema.prisma](file:///c:/Users/USUARIO.DESKTOP-I3J2EQD/OneDrive/Documentos/Web-Archives/CYC-CRM/prisma/schema.prisma). El cliente se conecta usando `@prisma/adapter-pg` en [src/lib/prisma.ts](file:///c:/Users/USUARIO.DESKTOP-I3J2EQD/OneDrive/Documentos/Web-Archives/CYC-CRM/src/lib/prisma.ts) para optimizar conexiones en entornos serverless.

### Modelos de Componentes de Hardware
Cada componente tiene su propia tabla fuertemente tipada con sus especificaciones físicas y técnicas para alimentar el motor de compatibilidad:
* **`Cpu`**: Socket (`AM4`, `AM5`, `LGA1700`, etc.), tipo de memoria (`DDR4`, `DDR5`), TDP en watts, gráficos integrados y si requiere cooler obligatorio.
* **`Motherboard`**: Socket, tipo de memoria, factor de forma (`ATX`, `Micro-ATX`, `Mini-ITX`), slots de RAM y capacidad máxima.
* **`Ram`**: Tipo de memoria, frecuencia MHz, capacidad GB y formato.
* **`Gpu`**: VRAM en GB, consumo recomendado de fuente (watts) y longitud en mm (`largoMm`).
* **`Cooler`**: Sockets soportados (`socketsSoportados String[]`), TDP disipable y tipo (Aire / Líquida AIO).
* **`Case`**: Factores de forma compatibles (`soportaFactoresForma String[]`), longitud máxima de GPU (`largoMaxGpuMm`) y si incluye fuente de poder.
* **`Psu`**: Potencia en Watts, certificación (`80 Plus Gold/Bronze`) y modularidad.
* **`Ssd`**: Formato (M.2 NVMe, 2.5" SATA), interfaz, capacidad GB y velocidades.
* **`Monitor`**: Tamaño en pulgadas, resolución (`1080p`, `1440p`, `4K`), tipo de panel y tasa de refresco (Hz).

> **Campos comunes en todos los productos:**
> * `precio`: Valor decimal o numérico.
> * `moneda`: `"USD"` o `"PEN"`.
> * `stock`: Cantidad física disponible.
> * `oculto`: Booleano para soft-delete (ocultar del catálogo sin borrar historial de ventas).
> * `cotizador`: Booleano que determina si el producto aparece como opción en el PC Builder.

### Modelos de Transacciones y Clientes
* **`Admin`**: Usuarios del personal con contraseña encriptada (`bcrypt`) para acceder a `/admin`.
* **`Cliente`**: Compradores de la tienda online con nombre, correo, teléfono y contraseña.
* **`Cotizacion`** y **`CotizacionItem`**: Ensambles armados en el PC Builder. Guardan el snapshot del ensamble, consumo total en watts, precio total y fecha de expiración (`expiresAt` a 3 días).
* **`Venta`** y **`VentaItem`**: Pedidos pagados mediante Stripe. Guardan el `stripeSessionId` para evitar duplicados, montos calculados (subtotal, IGV 18%, total) y referencias a los productos.
* **`TipoCambio`**: Historial y valor vigente de compra y venta del dólar (USD a PEN).

---

## 4. Seguridad y Autenticación

El sistema separa estrictamente la seguridad del **ERP administrativo** de la sesión del **cliente comprador**.

### Proxy Middleware (`src/proxy.ts`)
Ubicado en [src/proxy.ts](file:///c:/Users/USUARIO.DESKTOP-I3J2EQD/OneDrive/Documentos/Web-Archives/CYC-CRM/src/proxy.ts), actúa como el "guardián" de Next.js:
1. **Protección de `/admin/*`**: Si el usuario intenta entrar a cualquier ruta de administración sin una cookie de sesión válida (`cym.admin.session`), lo redirige inmediatamente a `/admin/login`.
2. **Autoredirección en Login**: Si un administrador con sesión activa entra a `/admin/login`, lo redirige al dashboard `/admin`.
3. **Autodestrucción de sesión al salir del ERP**: Si el navegador navega a cualquier página fuera de `/admin` (por ejemplo, a la tienda pública `/tienda`), el middleware borra automáticamente la cookie del administrador. Esto garantiza que nadie deje una sesión administrativa abierta en una máquina compartida mientras navega la tienda.

### Módulo de Sesión Admin (`src/lib/admin-auth.ts`)
Implementado en [src/lib/admin-auth.ts](file:///c:/Users/USUARIO.DESKTOP-I3J2EQD/OneDrive/Documentos/Web-Archives/CYC-CRM/src/lib/admin-auth.ts):
* Utiliza el estándar nativo **Web Crypto API (`crypto.subtle`)** con algoritmo `HMAC-SHA-256`. Esto lo hace compatible con entornos Edge y Serverless sin librerías pesadas.
* Emite cookies `HttpOnly`, `SameSite: Lax` y `Secure` (en producción).
* La cookie es de sesión (muere al cerrar el navegador) y el token expira internamente en 12 horas.

### Sesión de Clientes (NextAuth)
Los clientes usan NextAuth con credenciales en [src/app/api/auth/[...nextauth]/route.ts](file:///c:/Users/USUARIO.DESKTOP-I3J2EQD/OneDrive/Documentos/Web-Archives/CYC-CRM/src/app/api/auth/[...nextauth]/route.ts):
* Valida el correo y la contraseña contra la tabla `Cliente` usando `bcryptjs`.
* Permite guardar cotizaciones y asociar las compras de Stripe directamente al perfil del usuario.

---

## 5. E-Commerce y PC Builder (Tienda Pública)

### Catálogo y Filtros (`/tienda`)
* Muestra todos los productos activos (`oculto === false`).
* Filtros interactivos del lado del cliente por categoría de hardware, rango de precio, marca y disponibilidad de stock.
* Botón de compra rápida que agrega el ítem al carrito local.

### Configurador de PC (`/configurador`)
El PC Builder es una de las piezas centrales del proyecto. Cuenta con un diseño en **2 columnas**:
* **Columna izquierda**: Selector de pasos guiados (CPU → Motherboard → RAM → GPU → Cooler → Case → PSU → Extras como SSD y Monitor).
* **Columna derecha**: Resumen en tiempo real con cálculo de consumo energético (Watts), precio total y advertencias de compatibilidad.

#### Reglas de Validación de Compatibilidad:
1. **Socket**: El socket del procesador seleccionado debe coincidir exactamente con el socket de la placa madre (ej. `AM5` con `AM5`).
2. **Tipo de Memoria**: La RAM debe ser del mismo estándar que soporta la placa madre (`DDR4` o `DDR5`).
3. **Dimensiones de Gabinete y GPU**: La longitud de la tarjeta de video (`largoMm`) no puede exceder el espacio máximo que permite el gabinete (`largoMaxGpuMm`).
4. **Capacidad de la Fuente**: Calcula la suma de TDPs del sistema + margen de seguridad (mínimo 50W-100W adicionales). Si el usuario elige una fuente con menos watts de los requeridos por la GPU o el ensamble, el sistema emite una alerta preventiva.

### Generación de PDF y Cotizaciones (`/cotizacion`)
* **Exportar a PDF**: Emplea `jspdf` y `jspdf-autotable` para renderizar una proforma oficial con logotipo, desglose de componentes, precios en USD/PEN, IGV desglosado y fecha de validez de 3 días.
* **Guardar Cotización**: Si el usuario está registrado, envía la configuración al endpoint `/api/cotizaciones` y genera un número único correlativo (ej. `#CYM-2026-0042`).

### Carrito y Conversión de Moneda (`/carrito`)
* Almacena los ítems seleccionados en el estado local (`localStorage`).
* **Selector de Moneda**: Permite alternar entre Dólares (`USD`) y Soles (`PEN`) recalculando los precios en pantalla al instante según el tipo de cambio oficial obtenido desde `/api/tipo-cambio`.

---

## 6. Flujo de Pagos y Ventas (Stripe + Webhook)

```
[Usuario en Carrito] 
       │
       ▼ (POST /api/checkout)
[Crear Stripe Checkout Session] ───> [Pasarela de Pago de Stripe]
                                                   │
                                                   ▼ (Pago Exitoso)
                                       [Stripe Webhook Event]
                                                   │
                                                   ▼ (POST /api/stripe/webhook)
                                      1. Validar firma del webhook
                                      2. Verificar cliente existente
                                      3. Transacción en Base de Datos:
                                         - Crear Venta + VentaItems
                                         - Descontar stock de cada producto
```

### Creación de Sesión de Pago (`/api/checkout`)
* Recibe la lista de ítems del carrito.
* Construye los `line_items` en formato Stripe.
* Adjunta el `clienteId` en los metadatos de la sesión.
* Retorna la URL de Stripe hacia donde se redirige al cliente.

### Procesamiento del Webhook (`/api/stripe/webhook`)
Ubicado en [src/app/api/stripe/webhook/route.ts](file:///c:/Users/USUARIO.DESKTOP-I3J2EQD/OneDrive/Documentos/Web-Archives/CYC-CRM/src/app/api/stripe/webhook/route.ts):
1. **Validación de Firma**: Verifica que la petición provenga auténticamente de Stripe usando `stripe.webhooks.constructEvent(body, signature, webhookSecret)`.
2. **Idempotencia**: Busca si la sesión ya fue procesada (`prisma.venta.findUnique({ where: { stripeSessionId: session.id } })`). Si ya existe, ignora el evento para no duplicar ventas.
3. **Ejecución de Transacción Atómica**: Llama a `decrementStocks` en [src/lib/ventas.ts](file:///c:/Users/USUARIO.DESKTOP-I3J2EQD/OneDrive/Documentos/Web-Archives/CYC-CRM/src/lib/ventas.ts).

### Descuento Atómico de Stock (`src/lib/ventas.ts`)
* Se ejecuta dentro de una transacción `prisma.$transaction`.
* Recorre cada producto vendido y ejecuta una consulta decremental segura:
  ```ts
  await model.update({
    where: { id: item.productId },
    data: { stock: { decrement: item.qty } }
  });
  ```
* Genera un número correlativo formal para la venta (`PED-2026-XXXX`).

---

## 7. Panel Administrativo ERP (`/admin`)

El ERP es una suite completa para los operadores de la tienda:

### Dashboard de KPIs
* Consulta métricas en tiempo real: Ventas totales del mes en USD, número de cotizaciones activas, clientes registrados y alertas de productos con bajo stock (`stock <= 2`).

### Gestión de Inventario (CRUD + CSV + Cloudinary)
Ruta: `/admin/inventario`
* **Tabla Unificada**: Presenta procesadores, placas, memorias, tarjetas gráficas, fuentes, gabinetes, refrigeración, SSDs y monitores en una interfaz con buscador y filtros por categoría.
* **Subida a Cloudinary**: Al registrar o editar un producto, el formulario permite subir imágenes directamente a Cloudinary mediante el endpoint `/api/upload`, guardando la URL optimizada en la base de datos.
* **Importación y Exportación por CSV**: Permite descargar la plantilla de inventario en CSV, editar cientos de productos en Excel y volver a importarlos de forma masiva.
* **Interruptor de Cotizador**: Permite activar o desactivar qué productos específicos son elegibles para el PC Builder sin alterar su disponibilidad en la tienda general.

### Gestión de Cotizaciones y Clientes
* **`/admin/cotizaciones`**: Lista las proformas generadas por los usuarios, muestra si están vencidas o vigentes, y permite al personal marcarlas como "Atendidas / Cumplidas".
* **`/admin/clientes`**: Directorio de clientes con sus datos de contacto (nombre, correo, teléfono) y el historial de compras vinculadas.

### Gestión de Ventas
Ruta: `/admin/ventas`
* Registro de todas las transacciones cobradas por Stripe.
* Permite auditar el desglose de productos despachados, monto facturado y estado del pedido.

### Tipo de Cambio (USD / PEN)
Ruta: `/admin/tipo-cambio`
* Muestra el tipo de cambio oficial guardado en la base de datos.
* Permite actualizar manualmente o sincronizar los valores de compra y venta según la SUNAT para que toda la tienda refleje conversiones exactas.

---

## 8. Cron Jobs y Tareas en Segundo Plano

Para evitar que la base de datos se llene de cotizaciones obsoletas, el sistema implementa una tarea periódica:

* **Configuración en Vercel**: [vercel.json](file:///c:/Users/USUARIO.DESKTOP-I3J2EQD/OneDrive/Documentos/Web-Archives/CYC-CRM/vercel.json)
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/cleanup-cotizaciones",
        "schedule": "0 4 * * *"
      }
    ]
  }
  ```
* **Endpoint de Limpieza**: [src/app/api/cron/cleanup-cotizaciones/route.ts](file:///c:/Users/USUARIO.DESKTOP-I3J2EQD/OneDrive/Documentos/Web-Archives/CYC-CRM/src/app/api/cron/cleanup-cotizaciones/route.ts)
  * Se ejecuta automáticamente **una vez al día a las 4:00 AM UTC** (100% compatible con el plan gratuito Hobby de Vercel).
  * Protegido por el encabezado `Authorization: Bearer ${CRON_SECRET}`.
  * Elimina las cotizaciones y sus ítems cuya fecha de expiración haya pasado hace más de 3 días (`expiresAt < now - 3 días`).

---

## 9. Guía Rápida de Comandos y Despliegue

### Comandos de Desarrollo:
```bash
# Iniciar servidor local de desarrollo
npm run dev

# Validar tipos y compilar la aplicación para producción
npm run build

# Generar el cliente de Prisma tras cambiar schema.prisma
npx prisma generate

# Crear y aplicar una nueva migración a la base de datos
npx prisma migrate dev --name nombre_del_cambio

# Abrir Prisma Studio (explorador gráfico de la base de datos)
npx prisma studio
```

### Variables de Entorno Clave (`.env`):
* `DATABASE_URL`: Cadena de conexión de PostgreSQL (Neon).
* `AUTH_SECRET`: Llave secreta para firmar tokens de NextAuth y cookies del ERP.
* `NEXTAUTH_URL`: URL base de la aplicación (ej. `http://localhost:3000` o dominio en producción).
* `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`: Credenciales de la pasarela de pagos Stripe.
* `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Credenciales para el servicio de imágenes.
* `CRON_SECRET`: Token de autenticación para las tareas programadas de Vercel.

---

*Documento generado para el equipo de desarrollo de CYC-CRM / CYM Computer.*
