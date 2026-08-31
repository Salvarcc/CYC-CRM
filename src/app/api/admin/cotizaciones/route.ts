import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  PATCH — Marcar una cotización como Cumplida / Pendiente             */
/* ------------------------------------------------------------------ */

interface PatchPayload {
  rawId?: string;
  id?: string;
  cumplida?: boolean;
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  let body: PatchPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const id = body.rawId ?? body.id;
  if (!id) {
    return NextResponse.json({ error: "Falta el id de la cotización." }, { status: 400 });
  }

  const existente = await prisma.cotizacion.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
  }

  const cumplida = body.cumplida === true || body.cumplida === undefined
    ? !existente.cumplida
    : body.cumplida;

  const actualizada = await prisma.cotizacion.update({
    where: { id },
    data: { cumplida },
  });

  return NextResponse.json({ ok: true, cumplida: actualizada.cumplida });
}

/* ------------------------------------------------------------------ */
/*  GET — Listar todas las cotizaciones (admin)                         */
/* ------------------------------------------------------------------ */

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const now = new Date();

  const cotizaciones = await prisma.cotizacion.findMany({
    include: {
      items: true,
      cliente: { select: { id: true, nombre: true, correo: true, telefono: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = cotizaciones.map((c) => {
    const isExpired = new Date(c.expiresAt) < now;
    const status = c.cumplida ? "Cumplida" : isExpired ? "Expirada" : "Pendiente";
    const statusColor =
      status === "Cumplida" ? "success" : status === "Expirada" ? "error" : "warning";

    const components = c.items
      .map((i) => i.nombre)
      .join(", ");

    return {
      id: c.numero,
      client: c.cliente.nombre,
      date: c.createdAt.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      components,
      total: `${c.moneda === "PEN" ? "S/." : "$"}${Number(c.totalPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      status,
      statusColor,
      rawId: c.id,
      expiresAt: c.expiresAt,
      totalPrice: Number(c.totalPrice),
      moneda: c.moneda,
      cumplida: c.cumplida,
    };
  });

  return NextResponse.json(result);
}
