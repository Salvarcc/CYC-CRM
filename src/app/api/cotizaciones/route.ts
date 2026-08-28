import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ConfigProduct {
  id: string;
  nombre: string;
  marca: string;
  precio: number | null;
  moneda: string;
  category: string;
  categoryKey: string;
  imagenUrl: string | null;
  attrs: Record<string, unknown>;
}

interface SavePayload {
  selections: Record<string, ConfigProduct>;
  extras?: Record<string, ConfigProduct>;
  totalConsumption: number;
  totalPrice: number;
  moneda: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STEP_ORDER = ["cpu", "motherboard", "ram", "gpu", "cooler", "case", "psu"] as const;

async function generateNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.cotizacion.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });
  return `#CYM-${year}-${String(count + 1).padStart(4, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  POST — Guardar cotización                                          */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión para guardar cotizaciones." }, { status: 401 });
  }

  let body: SavePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { selections, extras, totalConsumption, totalPrice, moneda } = body;

  if (!selections || typeof selections !== "object") {
    return NextResponse.json({ error: "selections es requerido." }, { status: 400 });
  }

  if (typeof totalConsumption !== "number" || typeof totalPrice !== "number") {
    return NextResponse.json({ error: "totalConsumption y totalPrice son requeridos." }, { status: 400 });
  }

  /* Build items from selections */
  const items = STEP_ORDER.filter((key) => selections[key]).map((key) => {
    const p = selections[key];
    return {
      stepKey: key,
      productId: p.id,
      nombre: p.nombre,
      marca: p.marca,
      precio: p.precio ?? 0,
      moneda: p.moneda ?? "USD",
      imagenUrl: p.imagenUrl,
      category: p.category,
      categoryKey: p.categoryKey,
    };
  });

  /* Build items for extras (SSD, Monitor, …) */
  const extraItems = (extras && typeof extras === "object"
    ? Object.entries(extras)
    : []
  )
    .filter(([, p]) => p && typeof p === "object" && p.id)
    .map(([key, p]) => ({
      stepKey: `extra-${key}`,
      productId: p.id,
      nombre: p.nombre,
      marca: p.marca,
      precio: p.precio ?? 0,
      moneda: p.moneda ?? "USD",
      imagenUrl: p.imagenUrl,
      category: p.category,
      categoryKey: key,
    }));

  if (items.length === 0) {
    return NextResponse.json({ error: "Debes seleccionar al menos un componente." }, { status: 400 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 días
  const numero = await generateNumero();

  const cotizacion = await prisma.cotizacion.create({
    data: {
      clienteId: session.user.id,
      numero,
      totalConsumption,
      totalPrice,
      moneda: moneda ?? "USD",
      configuracion: {
        ...selections,
        ...(extraItems.length > 0 ? { extras: extras as Record<string, ConfigProduct> } : {}),
      } as unknown as Record<string, unknown>,
      createdAt: now,
      expiresAt,
      items: {
        create: [...items, ...extraItems],
      },
    },
    include: { items: true },
  });

  return NextResponse.json(cotizacion, { status: 201 });
}

/* ------------------------------------------------------------------ */
/*  GET — Listar cotizaciones del cliente                              */
/* ------------------------------------------------------------------ */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const cotizaciones = await prisma.cotizacion.findMany({
    where: {
      clienteId: session.user.id,
      expiresAt: { gt: new Date() },
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cotizaciones);
}
