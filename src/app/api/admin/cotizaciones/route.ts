import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET — Listar todas las cotizaciones (admin)                         */
/* ------------------------------------------------------------------ */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
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
    const status = isExpired ? "Completada" : "Pendiente";

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
      statusColor: status === "Pendiente" ? "warning" : "blue",
      rawId: c.id,
      expiresAt: c.expiresAt,
      totalPrice: Number(c.totalPrice),
      moneda: c.moneda,
    };
  });

  return NextResponse.json(result);
}
