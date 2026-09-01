import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const ssds = await prisma.ssd.findMany({ select: { nombre: true, marca: true } });
  console.log("=== SSDs ===");
  ssds.forEach(s => console.log(`"${s.nombre}" (Marca: ${s.marca})`));

  const monitors = await prisma.monitor.findMany({ select: { nombre: true, marca: true } });
  console.log("\n=== Monitors ===");
  monitors.forEach(m => console.log(`"${m.nombre}" (Marca: ${m.marca})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
