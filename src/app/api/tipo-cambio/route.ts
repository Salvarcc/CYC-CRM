import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const records = await prisma.tipoCambio.findMany({
      orderBy: { fecha: "desc" },
    });
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener tipo de cambio" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { compra, venta, fuente, fecha } = body;

    if (compra == null || venta == null) {
      return NextResponse.json(
        { error: "Los campos compra y venta son obligatorios" },
        { status: 400 },
      );
    }

    const tipoCambio = await prisma.tipoCambio.create({
      data: {
        compra: parseFloat(compra),
        venta: parseFloat(venta),
        fuente: fuente || "SUNAT",
        fecha: fecha ? new Date(fecha) : new Date(),
      },
    });

    return NextResponse.json(tipoCambio, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear tipo de cambio" },
      { status: 500 },
    );
  }
}