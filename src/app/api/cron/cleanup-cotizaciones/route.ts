import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    await prisma.$executeRaw`
      DELETE FROM "CotizacionItem"
      WHERE "cotizacionId" IN (
        SELECT id FROM "Cotizacion" WHERE "expiresAt" < ${cutoff}
      )
    `;

    const result = await prisma.cotizacion.deleteMany({
      where: { expiresAt: { lt: cutoff } },
    });

    return NextResponse.json({
      deleted: result.count,
      message: `Se eliminaron ${result.count} cotizaciones expiradas.`,
    });
  } catch (error) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json({ error: "Error en cleanup" }, { status: 500 });
  }
}
