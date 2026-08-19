# CYC CRM — Cotizador y Configurador de Equipos

Sistema CRM con módulo de PC Builder para el catálogo de productos CyM. Permite armar computadoras de escritorio validando compatibilidad de hardware en tiempo real.

## Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript
- **Estilos:** Tailwind CSS v4
- **UI:** React Aria Components, Recharts, TanStack Table, Sonner
- **Backend:** Prisma 7 + Neon (PostgreSQL serverless)
- **Driver adapter:** `@prisma/adapter-pg`

## Modelo de datos

7 componentes de hardware con sus atributos de compatibilidad:

| Modelo | Descripción |
|---|---|
| **Cpu** | Socket, tipoMemoria, TDP, gráficos integrados |
| **Motherboard** | Socket, tipoMemoria, factorForma, slots RAM |
| **Ram** | TipoMemoria, factorForma, capacidad, frecuencia |
| **Gpu** | VRAM, consumo recomendado de fuente, largo físico |
| **Cooler** | Sockets soportados, TDP disipado, tipo refrigeración |
| **Case** | Factores de forma, espacio GPU, fuente integrada |
| **Psu** | Potencia, certificación 80+, modularidad |

## API REST (CRUD)

Cada modelo expone los siguientes endpoints:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/{modelo}` | Listar todos |
| `POST` | `/api/{modelo}` | Crear nuevo |
| `GET` | `/api/{modelo}/[id]` | Obtener por ID |
| `PUT` | `/api/{modelo}/[id]` | Actualizar |
| `DELETE` | `/api/{modelo}/[id]` | Eliminar |

Modelos disponibles: `cpu`, `motherboard`, `ram`, `gpu`, `cooler`, `case`, `psu`

## Instalación

```bash
git clone https://github.com/Salvarcc/CYC-CRM.git
cd CYC-CRM
npm install
```

## Variables de entorno

Configurar el archivo `.env`:

```env
DATABASE_URL="postgresql://usuario:password@host/neondb?sslmode=require"
```

## Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Base de datos

Sincronizar el schema con Neon:

```bash
npx prisma db push      # aplicar cambios al schema
npx prisma generate     # regenerar el cliente Prisma
npx prisma studio       # GUI para inspeccionar datos
```

## Estructura del proyecto

```
src/
  app/
    api/                    # endpoints CRUD
      cpu/ [id]/
      motherboard/ [id]/
      ram/ [id]/
      gpu/ [id]/
      cooler/ [id]/
      case/ [id]/
      psu/ [id]/
    (with-layouts)/         # rutas con layout compartido
  lib/
    prisma.ts               # singleton PrismaClient
  components/
    tailgrids/core/         # primitivos de diseño
prisma/
  schema.prisma             # modelo de datos
```

## Reglas de compatibilidad (PC Builder)

El configurador aplica un filtrado en cascada:

1. **CPU** → define socket, tipoMemoria y TDP
2. **Motherboard** → filtra por socket del CPU
3. **RAM** → filtra por tipoMemoria de la Motherboard
4. **GPU** → valida largo contra Case y consumo contra PSU
5. **Cooler** → obligatorio si el CPU lo requiere; filtra por socket y TDP
6. **Case** → valida factor de forma, espacio GPU y ventiladores
7. **PSU** → obligatoria si el Case no incluye fuente; filtra por potencia

## Licencia

Proyecto privado — CyM
