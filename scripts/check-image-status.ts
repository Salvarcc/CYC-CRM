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

  console.log("--- PRODUCT IMAGES DIAGNOSTIC ---");
  let grandTotal = 0;
  let totalWithImage = 0;
  let totalPlaceholder = 0;
  let totalNull = 0;

  for (const m of models) {
    const items = await m.delegate.findMany();
    let realCount = 0;
    let placeholderCount = 0;
    let nullCount = 0;

    for (const item of items) {
      if (!item.imagenUrl) {
        nullCount++;
      } else if (item.imagenUrl.includes("placeholder") || item.imagenUrl.includes("via.placeholder") || item.imagenUrl.includes("svg")) {
        placeholderCount++;
      } else {
        realCount++;
      }
    }

    grandTotal += items.length;
    totalWithImage += realCount;
    totalPlaceholder += placeholderCount;
    totalNull += nullCount;

    console.log(`${m.name}: Total ${items.length} | Real Image: ${realCount} | Placeholder: ${placeholderCount} | Null: ${nullCount}`);
  }

  console.log("---------------------------------");
  console.log(`GRAND TOTAL: ${grandTotal} | Real: ${totalWithImage} | Placeholder: ${totalPlaceholder} | Null: ${totalNull}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
