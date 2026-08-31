import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const ventas = await prisma.venta.findMany({
    include: {
      items: true,
      cliente: { select: { id: true, nombre: true, correo: true, telefono: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = ventas.map((v) => {
    const totalArticulos = v.items.reduce((sum, i) => sum + i.qty, 0);
    return {
      id: v.numero,
      client: v.cliente.nombre,
      correo: v.cliente.correo,
      date: v.createdAt.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      items: totalArticulos,
      total: `$${Number(v.totalUsd).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      paymentMethod: "Tarjeta (Stripe)",
      status: v.estado,
      statusColor: v.estado === "Pagada" ? "success" : "warning",
      rawId: v.id,
      totalUsd: Number(v.totalUsd),
      subtotalUsd: Number(v.subtotalUsd),
      igvUsd: Number(v.igvUsd),
      createdAt: v.createdAt,
      stripeSessionId: v.stripeSessionId,
    };
  });

  return NextResponse.json(result);
}