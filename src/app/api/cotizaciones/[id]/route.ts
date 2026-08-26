import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET — Detalle de cotización                                         */
/* ------------------------------------------------------------------ */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { id } = await params;

  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!cotizacion) {
    return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
  }

  if (cotizacion.clienteId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (new Date(cotizacion.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Cotización expirada." }, { status: 410 });
  }

  return NextResponse.json(cotizacion);
}

/* ------------------------------------------------------------------ */
/*  DELETE — Eliminar cotización                                        */
/* ------------------------------------------------------------------ */

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { id } = await params;

  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id },
    select: { clienteId: true },
  });

  if (!cotizacion) {
    return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
  }

  if (cotizacion.clienteId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  await prisma.cotizacion.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
