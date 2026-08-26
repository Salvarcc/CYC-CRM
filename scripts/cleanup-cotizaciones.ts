/**
 * Limpieza de cotizaciones expiradas (>3 días).
 *
 * Ejecutar con:
 *   npx tsx scripts/cleanup-cotizaciones.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const result = await prisma.$executeRaw`
    DELETE FROM "CotizacionItem"
    WHERE "cotizacionId" IN (
      SELECT id FROM "Cotizacion" WHERE "expiresAt" < ${cutoff}
    )
  `;

  const deleted = await prisma.cotizacion.deleteMany({
    where: { expiresAt: { lt: cutoff } },
  });

  console.log(`Cotizaciones expiradas eliminadas: ${deleted.count}`);
  console.log(`Items eliminados: ${result}`);
}

main()
  .catch((e) => {
    console.error("Error en cleanup:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
