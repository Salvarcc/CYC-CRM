import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id requerido." }, { status: 400 });
  }

  const venta = await prisma.venta.findUnique({
    where: { stripeSessionId: sessionId },
    include: { items: true },
  });

  if (!venta) {
    return NextResponse.json({ venta: null });
  }

  if (venta.clienteId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  return NextResponse.json({
    venta: {
      id: venta.id,
      numero: venta.numero,
      estado: venta.estado,
      totalUsd: Number(venta.totalUsd),
      createdAt: venta.createdAt,
      items: venta.items.map((i) => ({
        nombre: i.nombre,
        marca: i.marca,
        precioUsd: Number(i.precioUsd),
        qty: i.qty,
      })),
    },
  });
}