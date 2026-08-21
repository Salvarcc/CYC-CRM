# CyM — Tienda y Cotizador de PCs

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Prisma](https://img.shields.io/badge/Prisma-7-2d3748) ![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00e599)

Plataforma e-commerce para **CyM**: tienda de componentes de PC, configurador con validación de compatibilidad en tiempo real, cotizador con exportación a PDF y panel administrativo interno.

## ¿Qué hace?

### Para el cliente

- **Catálogo** — componentes reales (CPU, placas madre, RAM, GPU, refrigeración, gabinetes, fuentes) con filtros por categoría, marca y precio, búsqueda, ordenamiento y paginación.
- **Configurador de PC** — asistente de 7 pasos que valida la compatibilidad del hardware en cascada mientras armas tu equipo: socket CPU↔placa, tipo de memoria, espacio físico de la GPU, potencia de la fuente, y más. Los pasos incompatibles desaparecen; los opcionales se marcan solos.
- **Cotización** — resumen profesional de tu build con consumo estimado en watts, precios convertibles entre USD y PEN con tipo de cambio real, envío por WhatsApp, correo o descarga en PDF.
- **Carrito de compras** — para comprar componentes sueltos.

### Para el negocio

Panel ERP interno con gestión de inventario, clientes, ventas, cotizaciones y tipo de cambio, más carga de imágenes a Cloudinary.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript |
| Estilos | Tailwind CSS v4 · Design tokens Material Design 3 |
| UI | React Aria Components · Recharts · TanStack Table · Sonner |
| Backend | Next.js API Routes · Prisma 7 |
| Base de datos | Neon (PostgreSQL serverless) |
| Imágenes | Cloudinary |

## Compatibilidad inteligente

El corazón del producto es el motor de compatibilidad del configurador:

```
CPU ──define──▶ Socket · Memoria · TDP
Motherboard ──filtra por──▶ Socket del CPU
RAM ──filtra por──▶ Tipo de memoria de la placa
Cooler ──filtra por──▶ Sockets soportados + TDP ≥ CPU
Case ──filtra por──▶ Factor de forma + largo GPU + ventiladores
PSU ──filtra por──▶ Potencia ≥ (TDP CPU + consumo GPU)
```

Al cambiar una selección, los pasos posteriores se invalidan automáticamente para nunca permitir builds incompatibles.

## Estado del proyecto

Proyecto en desarrollo activo. Módulo de tienda y configurador operativos; módulos de autenticación de clientes, promociones y modo oscuro en camino.

---

Proyecto privado — CyM
