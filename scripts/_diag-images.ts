import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const models = [
    ["Cpu", prisma.cpu], ["Motherboard", prisma.motherboard], ["Ram", prisma.ram],
    ["Gpu", prisma.gpu], ["Cooler", prisma.cooler], ["Case", prisma.case], ["Psu", prisma.psu],
    ["Ssd", prisma.ssd], ["Monitor", prisma.monitor],
  ] as const;
  let totalProducts = 0, totalWithImg = 0;
  for (const [name, m] of models) {
    const all = await (m as any).findMany({ select: { id: true, nombre: true, imagenUrl: true } });
    totalProducts += all.length;
    const withImg = all.filter((x: any) => x.imagenUrl).length;
    totalWithImg += withImg;
    const noImg = all.filter((x: any) => !x.imagenUrl);
    console.log(`\n=== ${name}: ${all.length} products, ${withImg} with image, ${all.length - withImg} WITHOUT ===`);
    for (const p of noImg) console.log(`   NO-IMG: ${p.nombre}`);
    const placeholder = all.filter((x: any) => x.imagenUrl && /cym-crm|cloudinary|\/image\//i.test(x.imagenUrl));
    if (placeholder.length) { console.log(`  (of those with img, ${placeholder.length} look like cloudinary/placeholder)`); }
  }
  console.log(`\nTOTAL: ${totalProducts} products, ${totalWithImg} with image, ${totalProducts - totalWithImg} WITHOUT image`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
