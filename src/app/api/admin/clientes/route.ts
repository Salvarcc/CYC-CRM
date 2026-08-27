import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET — Listar todos los clientes (admin)                             */
/* ------------------------------------------------------------------ */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const clientes = await prisma.cliente.findMany({
    include: {
      cotizaciones: {
        select: {
          id: true,
          totalPrice: true,
          moneda: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = clientes.map((c) => {
    const totalOrders = c.cotizaciones.length;
    const totalSpent = c.cotizaciones.reduce(
      (sum, cot) => sum + Number(cot.totalPrice),
      0,
    );
    const lastPurchase = c.cotizaciones.length > 0 ? c.cotizaciones[0].createdAt : null;

    let status: string;
    let statusColor: string;
    if (totalOrders >= 4) {
      status = "VIP";
      statusColor = "violet";
    } else if (totalOrders >= 1) {
      status = "Activo";
      statusColor = "success";
    } else {
      status = "Nuevo";
      statusColor = "cyan";
    }

    return {
      id: c.id,
      name: c.nombre,
      email: c.correo,
      phone: c.telefono,
      totalOrders,
      totalSpent: `$${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      lastPurchase: lastPurchase
        ? lastPurchase.toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
      status,
      statusColor,
    };
  });

  return NextResponse.json(result);
}
