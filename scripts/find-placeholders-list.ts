import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const models = [
    { name: "Cpu", delegate: prisma.cpu },
    { name: "Motherboard", delegate: prisma.motherboard },
    { name: "Ram", delegate: prisma.ram },
    { name: "Gpu", delegate: prisma.gpu },
    { name: "Cooler", delegate: prisma.cooler },
    { name: "Case", delegate: prisma.case },
    { name: "Psu", delegate: prisma.psu },
    { name: "Ssd", delegate: prisma.ssd },
    { name: "Monitor", delegate: prisma.monitor },
  ];

  console.log("=== PRODUCTS NEEDING REAL IMAGES ===");
  for (const m of models) {
    const items = await (m.delegate as any).findMany({ orderBy: { nombre: "asc" } });
    for (const item of items) {
      const url = item.imagenUrl || "";
      // Check if it's placeholder or data:1x1 or placehold.co
      if (!url || url.includes("data:1x1") || url.includes("placeholder") || url.includes("placehold.co") || !url.startsWith("http")) {
        console.log(`[${m.name}] ID: "${item.id}" | Name: "${item.nombre}" | Brand: "${item.marca}"`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
