import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function getBrand(n: string): string {
  const u = n.toUpperCase();
  if (u.includes("RYZEN") || u.includes("PROC AMD")) return "AMD";
  if (u.includes("INT") || u.includes("CORE")) return "Intel";
  if (u.includes("RTX") || u.includes("GTX")) return "NVIDIA";
  if (u.includes("RX90") || u.includes("RX76")) return "AMD";
  if (u.includes("ASUS") || u.includes(" AS ")) return "ASUS";
  if (u.includes("MSI")) return "MSI";
  if (u.includes("GB ") || u.includes("GIGA")) return "Gigabyte";
  if (u.includes("AR ")) return "Aerocool";
  if (u.includes("KF ") || u.includes("FURY")) return "Kingston";
  if (u.includes("TF ") || u.includes("TE-")) return "ThermalTake";
  if (u.includes("XPG")) return "XPG";
  if (u.includes("NH-")) return "Noctua";
  return "CyM";
}

function getCategory(n: string): string {
  const u = n.toUpperCase();
  if (u.includes("PROC")) return "CPU";
  if (u.includes("VGA")) return "GPU";
  if (u.includes("MB ")) return "MOTHERBOARD";
  if (u.includes("MEM RAM")) return "RAM";
  if (u.includes("COOLER") || u.includes("FAN-C") || u.includes("LC ")) return "COOLER";
  if (u.includes("CASE") || u.includes("CS ")) return "CASE";
  if (u.includes("PSU")) return "PSU";
  return "PRODUCT";
}

function getColor(brand: string): string {
  const c: Record<string, string> = {
    AMD: "1F71C7", Intel: "0068B5", NVIDIA: "76B900", ASUS: "00529B",
    MSI: "FF0000", Gigabyte: "E4002B", Kingston: "E4002B", ThermalTake: "00B2E3",
    XPG: "2B2B2B", Noctua: "FEBC42", Aerocool: "00B2E3", CyM: "B7131A",
  };
  return c[brand] || "333333";
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

async function uploadPlaceholder(nombre: string): Promise<string> {
  const brand = getBrand(nombre);
  const category = getCategory(nombre);
  const bg = getColor(brand);
  const slug = slugify(nombre);
  const shortName = nombre.length > 40 ? nombre.slice(0, 37) + "..." : nombre;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
    <rect width="600" height="600" fill="#${bg}"/>
    <text x="300" y="200" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="36" font-weight="bold">${escapeXml(brand)}</text>
    <text x="300" y="300" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="22" opacity="0.9">${escapeXml(category)}</text>
    <text x="300" y="420" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="14" opacity="0.7">${escapeXml(shortName)}</text>
  </svg>`;

  const result = await cloudinary.uploader.upload(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    {
      folder: "cym-crm/products",
      public_id: slug,
      resource_type: "image",
      format: "png",
      overwrite: true,
    },
  );

  return result.secure_url;
}

async function main() {
  const models = [
    { model: prisma.cpu, name: "CPU" },
    { model: prisma.gpu, name: "GPU" },
    { model: prisma.motherboard, name: "Motherboard" },
    { model: prisma.ram, name: "RAM" },
    { model: prisma.cooler, name: "Cooler" },
    { model: prisma.case, name: "Case" },
    { model: prisma.psu, name: "PSU" },
  ];

  let fixed = 0;
  let skipped = 0;
  let failed = 0;

  for (const { model, name } of models) {
    const items = await model.findMany({ orderBy: { nombre: "asc" } });
    console.log(`\n📦 ${name}s (${items.length})`);

    for (const item of items) {
      const url = item.imagenUrl || "";

      // Skip items with working Cloudinary URLs (real images with version)
      if (url.includes("/v1") && !url.includes("data:")) {
        skipped++;
        continue;
      }

      // Fix broken placeholders
      try {
        console.log(`  🔧 ${item.nombre}...`);
        const newUrl = await uploadPlaceholder(item.nombre);
        await model.update({ where: { id: item.id }, data: { imagenUrl: newUrl } });
        console.log(`  ✅ done`);
        fixed++;
      } catch (err: any) {
        console.log(`  ❌ ${err?.message || err}`);
        failed++;
      }
    }
  }

  console.log(`\n📊 Results: ${fixed} fixed, ${skipped} skipped, ${failed} failed`);
  await prisma.$disconnect();
}

main().catch(console.error);
