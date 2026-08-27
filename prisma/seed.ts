import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Clearing existing data...");
  await prisma.tipoCambio.deleteMany();
  await prisma.monitor.deleteMany();
  await prisma.ssd.deleteMany();
  await prisma.psu.deleteMany();
  await prisma.case.deleteMany();
  await prisma.gpu.deleteMany();
  await prisma.cooler.deleteMany();
  await prisma.ram.deleteMany();
  await prisma.motherboard.deleteMany();
  await prisma.cpu.deleteMany();
  console.log("✅ All 10 tables cleared");

  // ── Tipo de Cambio (initial rates) ────────────────────────────
  await prisma.tipoCambio.create({
    data: {
      compra: 3.72,
      venta: 3.75,
      fuente: "SUNAT",
      fecha: new Date(),
    },
  });
  console.log("  ✓ TipoCambio: 1 record (compra: 3.72, venta: 3.75)");

  // ── CPUs (33 products) ────────────────────────────────────
  await prisma.cpu.createMany({
    data: [
      // AMD Ryzen 5 AM5 8XXX
      { nombre: "PROC AMD RYZEN 5 8500G 3.50GHZ", marca: "AMD", socket: "AM5", tipoMemoria: "DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: true, precio: 214.51, stock: 10, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC AMD RYZEN 5 8600G 4.30GHZ", marca: "AMD", socket: "AM5", tipoMemoria: "DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: true, precio: 260.43, stock: 8, subcategoria: "Procesadores de Escritorio" },
      // AMD Ryzen 5 AM5 9XXX
      { nombre: "PROC AMD RYZEN 5 9600X 3.90GHZ", marca: "AMD", socket: "AM5", tipoMemoria: "DDR5", requiereCooler: true, tdp: 65, tieneGraficosIntegrados: true, precio: 360.22, stock: 6, subcategoria: "Procesadores de Escritorio" },
      // AMD Ryzen 7 AM5 8XXX
      { nombre: "PROC AMD RYZEN 7 8700F 4.10GHZ", marca: "AMD", socket: "AM5", tipoMemoria: "DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: false, precio: 352.78, stock: 6, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC AMD RYZEN 7 8700G 4.20GHZ", marca: "AMD", socket: "AM5", tipoMemoria: "DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: true, precio: 359.39, stock: 6, subcategoria: "Procesadores de Escritorio" },
      // AMD Ryzen 7 AM5 9XXX
      { nombre: "PROC AMD RYZEN 7 9800X3D 4.70G", marca: "AMD", socket: "AM5", tipoMemoria: "DDR5", requiereCooler: true, tdp: 120, tieneGraficosIntegrados: true, precio: 753.36, stock: 4, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC AMD RYZEN 7 9850X3D 4.70G", marca: "AMD", socket: "AM5", tipoMemoria: "DDR5", requiereCooler: true, tdp: 120, tieneGraficosIntegrados: true, precio: 802.92, stock: 3, subcategoria: "Procesadores de Escritorio" },
      // Intel Core i5 LGA1700 12XXX
      { nombre: "PROC INT CORE I5-12400 2.50GHZ", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: false, tdp: 117, tieneGraficosIntegrados: true, precio: 394.92, stock: 10, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I5-12400F 2.50GZ (Opcion A)", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: false, tdp: 117, tieneGraficosIntegrados: false, precio: 243.74, stock: 10, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I5-12400F 2.50GZ (Opcion B)", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: false, tdp: 117, tieneGraficosIntegrados: false, precio: 307.36, stock: 8, subcategoria: "Procesadores de Escritorio" },
      // Intel Core i5 LGA1700 14XXX
      { nombre: "PROC INT CORE I5-14400 2.50GHZ", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: true, precio: 456.05, stock: 8, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I5-14400F 2.50GZ", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: false, precio: 291.5, stock: 8, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I5-14600K 3.50G", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: true, tdp: 125, tieneGraficosIntegrados: true, precio: 419.95, stock: 6, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I5-14600KF 3.50G", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: true, tdp: 125, tieneGraficosIntegrados: false, precio: 404.83, stock: 6, subcategoria: "Procesadores de Escritorio" },
      // Intel Core i7 LGA1700 12XXX
      { nombre: "PROC INT CORE I7-12700F 2.10GZ", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: false, tdp: 180, tieneGraficosIntegrados: false, precio: 484.97, stock: 5, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I7-12700K 3.60GH", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: true, tdp: 125, tieneGraficosIntegrados: true, precio: 502.31, stock: 4, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I7-12700KF 3.60G", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: true, tdp: 125, tieneGraficosIntegrados: false, precio: 500.66, stock: 4, subcategoria: "Procesadores de Escritorio" },
      // Intel Core i7 LGA1700 14XXX
      { nombre: "PROC INT CORE I7-14700 2.10GHZ", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: true, precio: 637.78, stock: 4, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I7-14700F 2.10GZ", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: false, precio: 575.01, stock: 4, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I7-14700KF 3.40G", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: true, tdp: 125, tieneGraficosIntegrados: false, precio: 627.87, stock: 3, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I7-14700KF TRAY", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: true, tdp: 125, tieneGraficosIntegrados: false, precio: 543.62, stock: 3, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I7-14700 2.1 OEM", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: true, tdp: 65, tieneGraficosIntegrados: true, precio: 609.7, stock: 3, subcategoria: "Procesadores de Escritorio" },
      // Intel Core i9 LGA1700 14XXX
      { nombre: "PROC INT CORE I9-14900 2.0GHZ", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: true, precio: 984.67, stock: 3, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I9-14900F 2.0GHZ", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: false, precio: 939.78, stock: 3, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I9-14900K 3.20G", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: true, tdp: 125, tieneGraficosIntegrados: true, precio: 935.35, stock: 2, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I9-14900KF 3.20G", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: true, tdp: 125, tieneGraficosIntegrados: false, precio: 873.96, stock: 2, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE I9-14900KS 3.20G", marca: "Intel", socket: "LGA1700", tipoMemoria: "DDR4, DDR5", requiereCooler: true, tdp: 150, tieneGraficosIntegrados: true, precio: 1172.54, stock: 2, subcategoria: "Procesadores de Escritorio" },
      // Intel Core Ultra 5 LGA1851
      { nombre: "PROC INT COR ULTRA 5 225F 3.3G", marca: "Intel", socket: "LGA1851", tipoMemoria: "DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: false, precio: 277.45, stock: 6, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT COR ULT 5 245K 4.20GZ", marca: "Intel", socket: "LGA1851", tipoMemoria: "DDR5", requiereCooler: true, tdp: 125, tieneGraficosIntegrados: true, precio: 358.57, stock: 5, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT COR ULT 5 245KF 4.20G", marca: "Intel", socket: "LGA1851", tipoMemoria: "DDR5", requiereCooler: true, tdp: 125, tieneGraficosIntegrados: false, precio: 333.79, stock: 5, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT COR ULT 5 250K PLUS", marca: "Intel", socket: "LGA1851", tipoMemoria: "DDR5", requiereCooler: true, tdp: 125, tieneGraficosIntegrados: true, precio: 375.09, stock: 4, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT COR ULTRA 5 225 3.30G", marca: "Intel", socket: "LGA1851", tipoMemoria: "DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: true, precio: 307.36, stock: 5, subcategoria: "Procesadores de Escritorio" },
      // Intel Core Ultra 7 LGA1851
      { nombre: "PROC INT CORE ULT 7 265 2.40G", marca: "Intel", socket: "LGA1851", tipoMemoria: "DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: true, precio: 613.0, stock: 4, subcategoria: "Procesadores de Escritorio" },
      { nombre: "PROC INT CORE ULT 7 265F 2.40G", marca: "Intel", socket: "LGA1851", tipoMemoria: "DDR5", requiereCooler: false, tdp: 65, tieneGraficosIntegrados: false, precio: 583.27, stock: 4, subcategoria: "Procesadores de Escritorio" },
      // Intel Core Ultra 9 LGA1851
      { nombre: "PROC INT COR ULT 9 285K 3.70G", marca: "Intel", socket: "LGA1851", tipoMemoria: "DDR5", requiereCooler: true, tdp: 125, tieneGraficosIntegrados: true, precio: 987.98, stock: 2, subcategoria: "Procesadores de Escritorio" },
    ],
  });
  console.log("  ✓ CPUs: 33 products");

  // ── Motherboards (23 products) ─────────────────────────────
  await prisma.motherboard.createMany({
    data: [
      // LGA1700 DDR4
      { nombre: "MB GB B760M D3HP S/V/L DDR4", marca: "GIGABYTE", socket: "LGA1700", tipoMemoria: "DDR4", factorForma: "Micro-ATX", ramSlots: 4, maxMemoriaGB: 128, precio: 139.64, stock: 8, subcategoria: "AMD AM5" },
      { nombre: "MB GB Z790-D S/V/L DDR4", marca: "GIGABYTE", socket: "LGA1700", tipoMemoria: "DDR4", factorForma: "ATX", ramSlots: 4, maxMemoriaGB: 128, precio: 323.84, stock: 5, subcategoria: "AMD AM5" },
      { nombre: "MB MS PRO B760M-P S/V/L DDR4", marca: "MSI", socket: "LGA1700", tipoMemoria: "DDR4", factorForma: "Micro-ATX", ramSlots: 4, maxMemoriaGB: 128, precio: 136.33, stock: 10, subcategoria: "AMD AM5" },
      { nombre: "MB MS H610M-S S/V/L DDR4", marca: "MSI", socket: "LGA1700", tipoMemoria: "DDR4", factorForma: "Micro-ATX", ramSlots: 2, maxMemoriaGB: 64, precio: 101.64, stock: 12, subcategoria: "AMD AM5" },
      // LGA1700 DDR5
      { nombre: "MB AS PRIME B760M-A S/V/L DDR5", marca: "ASUS", socket: "LGA1700", tipoMemoria: "DDR5", factorForma: "Micro-ATX", ramSlots: 4, maxMemoriaGB: 192, precio: 161.21, stock: 8, subcategoria: "Intel LGA 1700" },
      { nombre: "MB GB B760 DS3H S/V/L DDR5", marca: "GIGABYTE", socket: "LGA1700", tipoMemoria: "DDR5", factorForma: "ATX", ramSlots: 4, maxMemoriaGB: 192, precio: 168.55, stock: 7, subcategoria: "Intel LGA 1700" },
      { nombre: "MB GB H610M K V2 S/V/L DDR5", marca: "GIGABYTE", socket: "LGA1700", tipoMemoria: "DDR5", factorForma: "Micro-ATX", ramSlots: 2, maxMemoriaGB: 96, precio: 100.81, stock: 10, subcategoria: "Intel LGA 1700" },
      { nombre: "MB MS PRO B760M-E S/V/L DDR5", marca: "MSI", socket: "LGA1700", tipoMemoria: "DDR5", factorForma: "Micro-ATX", ramSlots: 2, maxMemoriaGB: 96, precio: 147.07, stock: 8, subcategoria: "Intel LGA 1700" },
      // LGA1851 DDR5
      { nombre: "MB AR B860M-H2 S/V/L DDR5", marca: "ASROCK", socket: "LGA1851", tipoMemoria: "DDR5", factorForma: "Micro-ATX", ramSlots: 2, maxMemoriaGB: 96, precio: 151.2, stock: 6, subcategoria: "Intel LGA 1851" },
      { nombre: "MB AS PRIME H810M-E S/V/L DDR5", marca: "ASUS", socket: "LGA1851", tipoMemoria: "DDR5", factorForma: "Micro-ATX", ramSlots: 2, maxMemoriaGB: 96, precio: 143.77, stock: 7, subcategoria: "Intel LGA 1851" },
      { nombre: "MB GB B860M K S/V/L DDR5", marca: "GIGABYTE", socket: "LGA1851", tipoMemoria: "DDR5", factorForma: "Micro-ATX", ramSlots: 2, maxMemoriaGB: 96, precio: 159.46, stock: 7, subcategoria: "Intel LGA 1851" },
      { nombre: "MB MS PRO B860M-E S/V/L DDR5", marca: "MSI", socket: "LGA1851", tipoMemoria: "DDR5", factorForma: "Micro-ATX", ramSlots: 2, maxMemoriaGB: 96, precio: 158.63, stock: 6, subcategoria: "Intel LGA 1851" },
      // LGA1851 DDR5 GAMING
      { nombre: "MB AR Z890 TAICHI S/V/L DDR5", marca: "ASROCK", socket: "LGA1851", tipoMemoria: "DDR5", factorForma: "ATX", ramSlots: 4, maxMemoriaGB: 256, precio: 801.26, stock: 2, subcategoria: "Intel LGA 1851" },
      { nombre: "MB AS STRIX B860-A GAMING WIFI", marca: "ASUS", socket: "LGA1851", tipoMemoria: "DDR5", factorForma: "ATX", ramSlots: 4, maxMemoriaGB: 192, precio: 389.88, stock: 4, subcategoria: "Intel LGA 1851" },
      { nombre: "MB AS STRIX Z890-F GAMING WIFI", marca: "ASUS", socket: "LGA1851", tipoMemoria: "DDR5", factorForma: "ATX", ramSlots: 4, maxMemoriaGB: 192, precio: 646.22, stock: 3, subcategoria: "Intel LGA 1851" },
      // AM5 DDR5
      { nombre: "MB AR B850M-X WIFI S/V/L DDR5", marca: "ASROCK", socket: "AM5", tipoMemoria: "DDR5", factorForma: "Micro-ATX", ramSlots: 2, maxMemoriaGB: 96, precio: 194.13, stock: 6, subcategoria: "AMD AM5" },
      { nombre: "MB AS PRIME B650M-A II SVL DR5", marca: "ASUS", socket: "AM5", tipoMemoria: "DDR5", factorForma: "Micro-ATX", ramSlots: 4, maxMemoriaGB: 192, precio: 185.88, stock: 7, subcategoria: "AMD AM5" },
      { nombre: "MB GB B840M DS3H S/V/L DDR5", marca: "GIGABYTE", socket: "AM5", tipoMemoria: "DDR5", factorForma: "Micro-ATX", ramSlots: 4, maxMemoriaGB: 192, precio: 161.95, stock: 8, subcategoria: "AMD AM5" },
      { nombre: "MB MS PRO X870E-P WIFI DDR5", marca: "MSI", socket: "AM5", tipoMemoria: "DDR5", factorForma: "ATX", ramSlots: 4, maxMemoriaGB: 256, precio: 385.34, stock: 4, subcategoria: "AMD AM5" },
      // AM5 DDR5 GAMING
      { nombre: "MB AR X870 STEEL LEGEND WF DR5", marca: "ASROCK", socket: "AM5", tipoMemoria: "DDR5", factorForma: "ATX", ramSlots: 4, maxMemoriaGB: 256, precio: 478.88, stock: 3, subcategoria: "AMD AM5" },
      { nombre: "MB AS B650E-F GMG SVL WF DDR5", marca: "ASUS", socket: "AM5", tipoMemoria: "DDR5", factorForma: "ATX", ramSlots: 4, maxMemoriaGB: 192, precio: 406.39, stock: 4, subcategoria: "AMD AM5" },
      { nombre: "MB AS TUF GAMING B850-PLUS WF", marca: "ASUS", socket: "AM5", tipoMemoria: "DDR5", factorForma: "ATX", ramSlots: 4, maxMemoriaGB: 192, precio: 371.72, stock: 5, subcategoria: "AMD AM5" },
      { nombre: "MB GB B650 GAMING X AX V2 DDR5", marca: "GIGABYTE", socket: "AM5", tipoMemoria: "DDR5", factorForma: "ATX", ramSlots: 4, maxMemoriaGB: 192, precio: 250.5, stock: 6, subcategoria: "AMD AM5" },
    ],
  });
  console.log("  ✓ Motherboards: 23 products");

  // ── RAM (13 products) ─────────────────────────────────────
  await prisma.ram.createMany({
    data: [
      // DDR4 3200
      { nombre: "MEM RAM 8G HIK ARM 3.20GH DDR4", marca: "HIKSEMI", tipoMemoria: "DDR4", factorForma: "DIMM", capacidadGB: 8, frecuenciaMHz: 3200, precio: 102.4, stock: 15, subcategoria: "DDR4" },
      { nombre: "MEM RAM 8G TF DELTA RGB 3.20GZ", marca: "TEAMGROUP", tipoMemoria: "DDR4", factorForma: "DIMM", capacidadGB: 8, frecuenciaMHz: 3200, precio: 110.85, stock: 12, subcategoria: "DDR4" },
      { nombre: "MEM RAM 16G FURY BEAST 3.2G D4", marca: "KINGSTON", tipoMemoria: "DDR4", factorForma: "DIMM", capacidadGB: 16, frecuenciaMHz: 3200, precio: 207.49, stock: 10, subcategoria: "DDR4" },
      { nombre: "MEM RAM 16G XPG GAMMIX D20 3.2", marca: "ADATA", tipoMemoria: "DDR4", factorForma: "DIMM", capacidadGB: 16, frecuenciaMHz: 3200, precio: 176.81, stock: 10, subcategoria: "DDR4" },
      { nombre: "MEM RAM 32G FURY 3.20G DDR4", marca: "KINGSTON", tipoMemoria: "DDR4", factorForma: "DIMM", capacidadGB: 32, frecuenciaMHz: 3200, precio: 710.94, stock: 4, subcategoria: "DDR4" },
      // DDR4 3600
      { nombre: "MEM RAM 8G FURY BEAST 3.60G D4", marca: "KINGSTON", tipoMemoria: "DDR4", factorForma: "DIMM", capacidadGB: 8, frecuenciaMHz: 3600, precio: 156.87, stock: 8, subcategoria: "DDR4" },
      { nombre: "MEM RAM 16G BEAST RGB 3.60G D4", marca: "KINGSTON", tipoMemoria: "DDR4", factorForma: "DIMM", capacidadGB: 16, frecuenciaMHz: 3600, precio: 226.51, stock: 8, subcategoria: "DDR4" },
      // DDR5 5200
      { nombre: "MEM RAM 8G HS HIKER 5.20G SOD", marca: "HIKSEMI", tipoMemoria: "DDR5", factorForma: "SODIMM", capacidadGB: 8, frecuenciaMHz: 5200, precio: 181.41, stock: 6, subcategoria: "DDR5" },
      { nombre: "MEM RAM 16G KF 5.2G RGB WHI D5", marca: "KINGSTON", tipoMemoria: "DDR5", factorForma: "DIMM", capacidadGB: 16, frecuenciaMHz: 5200, precio: 359.07, stock: 5, subcategoria: "DDR5" },
      // DDR5 5600
      { nombre: "MEM RAM 8G XPG LAN RGB 5.60G", marca: "ADATA", tipoMemoria: "DDR5", factorForma: "DIMM", capacidadGB: 8, frecuenciaMHz: 5600, precio: 188.31, stock: 8, subcategoria: "DDR5" },
      { nombre: "MEM RAM 8G TF VULCAN 5.60G DR5", marca: "TEAMGROUP", tipoMemoria: "DDR5", factorForma: "DIMM", capacidadGB: 8, frecuenciaMHz: 5600, precio: 197.83, stock: 8, subcategoria: "DDR5" },
      { nombre: "MEM RAM 16G TF VULCAN 5.60GHZ", marca: "TEAMGROUP", tipoMemoria: "DDR5", factorForma: "DIMM", capacidadGB: 16, frecuenciaMHz: 5600, precio: 351.78, stock: 6, subcategoria: "DDR5" },
      { nombre: "MEM RAM 16G KF BEAST RGB 5.6GZ", marca: "KINGSTON", tipoMemoria: "DDR5", factorForma: "DIMM", capacidadGB: 16, frecuenciaMHz: 5600, precio: 357.15, stock: 6, subcategoria: "DDR5" },
    ],
  });
  console.log("  ✓ RAM: 13 products");

  // ── Coolers (11 products) ─────────────────────────────────
  await prisma.cooler.createMany({
    data: [
      // Air
      { nombre: "FAN-COOLER IS-40-XT BLACK", marca: "ID-COOLING", socketsSoportados: ["LGA1700", "LGA1200", "LGA115X", "AM4", "AM5"], tdpSoportadoWatts: 100, tipoRefrigeracion: "Aire", numeroVentiladores: 1, precio: 170.2, stock: 4, subcategoria: "Aire" },
      { nombre: "FAN-C NC NH-U14S PREMIUM", marca: "NOCTUA", socketsSoportados: ["LGA1700", "LGA1851", "LGA1200", "AM4", "AM5"], tdpSoportadoWatts: 220, tipoRefrigeracion: "Aire", numeroVentiladores: 1, precio: 166.07, stock: 5, subcategoria: "Aire" },
      { nombre: "COOLER PARA CPU TE-8166N AIRE", marca: "TEROS", socketsSoportados: ["LGA1700", "LGA1200", "AM4", "AM5"], tdpSoportadoWatts: 200, tipoRefrigeracion: "Aire", numeroVentiladores: 1, precio: 44.63, stock: 15, subcategoria: "Aire" },
      // Liquid 240mm
      { nombre: "COOLER PARA CPU TE-8164N LIQU", marca: "TEROS", socketsSoportados: ["LGA1700", "LGA1200", "AM4", "AM5"], tdpSoportadoWatts: 265, tipoRefrigeracion: "Liquida (AIO)", numeroVentiladores: 2, precio: 74.34, stock: 10, subcategoria: "Líquida 240mm" },
      { nombre: "COOLER GB AIO GME 240", marca: "GIGABYTE", socketsSoportados: ["LGA1700", "LGA1851", "AM4", "AM5"], tdpSoportadoWatts: 280, tipoRefrigeracion: "Liquida (AIO)", numeroVentiladores: 2, precio: 91.1, stock: 8, subcategoria: "Líquida 240mm" },
      { nombre: "COOLER MSI MAG CLQD A13 240 N", marca: "MSI", socketsSoportados: ["LGA1700", "LGA1851", "AM4", "AM5"], tdpSoportadoWatts: 270, tipoRefrigeracion: "Liquida (AIO)", numeroVentiladores: 2, precio: 88.79, stock: 8, subcategoria: "Líquida 240mm" },
      { nombre: "COOLER MSI AIO CORELIQUID E240", marca: "MSI", socketsSoportados: ["LGA1700", "LGA1851", "AM4", "AM5"], tdpSoportadoWatts: 280, tipoRefrigeracion: "Liquida (AIO)", numeroVentiladores: 2, precio: 146.93, stock: 5, subcategoria: "Líquida 240mm" },
      // Liquid 360mm
      { nombre: "LC AS PRIME 360 ARGB WHITE", marca: "ASUS", socketsSoportados: ["LGA1700", "LGA1851", "AM4", "AM5"], tdpSoportadoWatts: 300, tipoRefrigeracion: "Liquida (AIO)", numeroVentiladores: 3, precio: 135.37, stock: 5, subcategoria: "Líquida 360mm" },
      { nombre: "COOLER AS AIO RYU III 360 RG X", marca: "ASUS", socketsSoportados: ["LGA1700", "LGA1851", "AM4", "AM5"], tdpSoportadoWatts: 350, tipoRefrigeracion: "Liquida (AIO)", numeroVentiladores: 3, precio: 512.21, stock: 2, subcategoria: "Líquida 360mm" },
      { nombre: "COOLER GB AIO GME 360 BLACK", marca: "GIGABYTE", socketsSoportados: ["LGA1700", "LGA1851", "AM4", "AM5"], tdpSoportadoWatts: 320, tipoRefrigeracion: "Liquida (AIO)", numeroVentiladores: 3, precio: 105.54, stock: 6, subcategoria: "Líquida 360mm" },
      { nombre: "COOLER MSI MAG CLQD A13 360 N", marca: "MSI", socketsSoportados: ["LGA1700", "LGA1851", "AM4", "AM5"], tdpSoportadoWatts: 300, tipoRefrigeracion: "Liquida (AIO)", numeroVentiladores: 3, precio: 102.47, stock: 6, subcategoria: "Líquida 360mm" },
    ],
  });
  console.log("  ✓ Coolers: 11 products");

  // ── GPUs (12 products) ────────────────────────────────────
  await prisma.gpu.createMany({
    data: [
      // NVIDIA Gaming
      { nombre: "VGA 6G MS RTX3050 LP GDDR6", marca: "MSI", vramGB: 6, consumoRecomendadoFuenteWatts: 300, largoMm: 174, precio: 327.24, stock: 6, subcategoria: "NVIDIA GeForce RTX" },
      { nombre: "VGA 8G AS RTX5060 DUAL GDDR7", marca: "ASUS", vramGB: 8, consumoRecomendadoFuenteWatts: 550, largoMm: 227, precio: 733.09, stock: 4, subcategoria: "NVIDIA GeForce RTX" },
      { nombre: "VGA 12G AS RTX5070 DUAL OC", marca: "ASUS", vramGB: 12, consumoRecomendadoFuenteWatts: 650, largoMm: 268, precio: 1259.63, stock: 3, subcategoria: "NVIDIA GeForce RTX" },
      { nombre: "VGA 12G GB RTX5070 AERO OC GD7", marca: "GIGABYTE", vramGB: 12, consumoRecomendadoFuenteWatts: 650, largoMm: 300, precio: 1135.63, stock: 3, subcategoria: "NVIDIA GeForce RTX" },
      { nombre: "VGA 32G AS RTX5090 TUF OC GDR7", marca: "ASUS", vramGB: 32, consumoRecomendadoFuenteWatts: 1000, largoMm: 348, precio: 5218.6, stock: 2, subcategoria: "NVIDIA GeForce RTX" },
      { nombre: "VGA 32G GB RTX5090 MASTER", marca: "GIGABYTE", vramGB: 32, consumoRecomendadoFuenteWatts: 1000, largoMm: 358, precio: 5857.88, stock: 1, subcategoria: "NVIDIA GeForce RTX" },
      // AMD Radeon Gaming
      { nombre: "VGA 8G GB RX7600 GAMING OC GD6", marca: "GIGABYTE", vramGB: 8, consumoRecomendadoFuenteWatts: 550, largoMm: 282, precio: 492.83, stock: 5, subcategoria: "AMD Radeon RX" },
      { nombre: "VGA 8G AS RX9060XT PRIME GDDR6", marca: "ASUS", vramGB: 8, consumoRecomendadoFuenteWatts: 600, largoMm: 240, precio: 580.25, stock: 4, subcategoria: "AMD Radeon RX" },
      { nombre: "VGA 16G XF RX9060XT 3X GDDR6", marca: "XFX", vramGB: 16, consumoRecomendadoFuenteWatts: 650, largoMm: 304, precio: 741.52, stock: 3, subcategoria: "AMD Radeon RX" },
      { nombre: "VGA 16G AS RX9060XT DUAL GDDR6", marca: "ASUS", vramGB: 16, consumoRecomendadoFuenteWatts: 650, largoMm: 227, precio: 736.14, stock: 3, subcategoria: "AMD Radeon RX" },
      { nombre: "VGA 16G GB RX9070 GMG OC GDDR6", marca: "GIGABYTE", vramGB: 16, consumoRecomendadoFuenteWatts: 750, largoMm: 286, precio: 1032.58, stock: 3, subcategoria: "AMD Radeon RX" },
      { nombre: "VGA 16G GB RX9070XT AO ELT GD6", marca: "GIGABYTE", vramGB: 16, consumoRecomendadoFuenteWatts: 800, largoMm: 330, precio: 1317.9, stock: 2, subcategoria: "AMD Radeon RX" },
    ],
  });
  console.log("  ✓ GPUs: 12 products");

  // ── Cases (12 products) ───────────────────────────────────
  await prisma.case.createMany({
    data: [
      // ATX con fuente
      { nombre: "CASE STD ATX TE1036 250W BK", marca: "TEROS", soportaFactoresForma: ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"], largoMaxGpuMm: 300, tieneFuentePoder: true, potenciaFuenteWatts: 250, soportaFanCoolerVentiladores: 1, precio: 36.45, stock: 10, subcategoria: "Mid Tower ATX" },
      { nombre: "CASE STD ATX TE1037 250W BK", marca: "TEROS", soportaFactoresForma: ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"], largoMaxGpuMm: 300, tieneFuentePoder: true, potenciaFuenteWatts: 250, soportaFanCoolerVentiladores: 1, precio: 36.45, stock: 10, subcategoria: "Mid Tower ATX" },
      { nombre: "CASE STD ATX TE1038 250W BK", marca: "TEROS", soportaFactoresForma: ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"], largoMaxGpuMm: 300, tieneFuentePoder: true, potenciaFuenteWatts: 250, soportaFanCoolerVentiladores: 1, precio: 37.06, stock: 10, subcategoria: "Mid Tower ATX" },
      { nombre: "CASE MICRO ATX 450W TE1319G", marca: "TEROS", soportaFactoresForma: ["Micro-ATX", "Mini-ITX"], largoMaxGpuMm: 310, tieneFuentePoder: true, potenciaFuenteWatts: 450, soportaFanCoolerVentiladores: 2, precio: 51.02, stock: 8, subcategoria: "Micro Tower" },
      // Cases gamers con fuente
      { nombre: "CS MS ATX FRGE 120AAF 650W 80B", marca: "MSI", soportaFactoresForma: ["ATX", "Micro-ATX", "Mini-ITX"], largoMaxGpuMm: 330, tieneFuentePoder: true, potenciaFuenteWatts: 650, soportaFanCoolerVentiladores: 2, precio: 127.72, stock: 5, subcategoria: "Mid Tower ATX" },
      { nombre: "CS MS MATX FRGE M100A 600W 80W", marca: "MSI", soportaFactoresForma: ["Micro-ATX", "Mini-ITX"], largoMaxGpuMm: 300, tieneFuentePoder: true, potenciaFuenteWatts: 600, soportaFanCoolerVentiladores: 2, precio: 98.27, stock: 6, subcategoria: "Micro Tower" },
      // Cases gamers sin fuente
      { nombre: "CASE STD ATX TE1323 BLACK", marca: "TEROS", soportaFactoresForma: ["ATX", "Micro-ATX", "Mini-ITX"], largoMaxGpuMm: 320, tieneFuentePoder: false, potenciaFuenteWatts: 0, soportaFanCoolerVentiladores: 2, precio: 47.2, stock: 10, subcategoria: "Mid Tower ATX" },
      { nombre: "CS AS A31 PLUS ATX WHITE ARGB", marca: "ASUS", soportaFactoresForma: ["ATX", "Micro-ATX", "Mini-ITX"], largoMaxGpuMm: 380, tieneFuentePoder: false, potenciaFuenteWatts: 0, soportaFanCoolerVentiladores: 3, precio: 115.14, stock: 5, subcategoria: "Mid Tower ATX" },
      { nombre: "CS AS AP202 MATX BLACK ARGB", marca: "ASUS", soportaFactoresForma: ["Micro-ATX", "Mini-ITX"], largoMaxGpuMm: 338, tieneFuentePoder: false, potenciaFuenteWatts: 0, soportaFanCoolerVentiladores: 3, precio: 145.88, stock: 4, subcategoria: "Micro Tower" },
      { nombre: "CS AS ATX GT302 ARGB WHITE", marca: "ASUS", soportaFactoresForma: ["E-ATX", "ATX", "Micro-ATX", "Mini-ITX"], largoMaxGpuMm: 407, tieneFuentePoder: false, potenciaFuenteWatts: 0, soportaFanCoolerVentiladores: 3, precio: 159.03, stock: 4, subcategoria: "Mid Tower ATX" },
      { nombre: "CS GB C201P M-ATX ARGB WHITE", marca: "GIGABYTE", soportaFactoresForma: ["Micro-ATX", "Mini-ITX"], largoMaxGpuMm: 340, tieneFuentePoder: false, potenciaFuenteWatts: 0, soportaFanCoolerVentiladores: 2, precio: 76.67, stock: 6, subcategoria: "Micro Tower" },
      { nombre: "CS MS ATX MAG FORGE 120A AIRFL", marca: "MSI", soportaFactoresForma: ["ATX", "Micro-ATX", "Mini-ITX"], largoMaxGpuMm: 330, tieneFuentePoder: false, potenciaFuenteWatts: 0, soportaFanCoolerVentiladores: 2, precio: 69.82, stock: 7, subcategoria: "Mid Tower ATX" },
    ],
  });
  console.log("  ✓ Cases: 12 products");

  // ── PSUs (15 products) ────────────────────────────────────
  await prisma.psu.createMany({
    data: [
      // ASROCK
      { nombre: "PSU AR 750W NM 80+B CL-750B", marca: "ASROCK", potenciaWatts: 750, certificacion80Plus: "Bronze", esModular: false, factorForma: "ATX", precio: 86.3, stock: 8, subcategoria: "80+ Bronze" },
      { nombre: "PSU AR PG-850P 80+P FM SFX", marca: "ASROCK", potenciaWatts: 850, certificacion80Plus: "Platinum", esModular: true, factorForma: "SFX", precio: 250.44, stock: 3, subcategoria: "80+ Platinum" },
      { nombre: "PSU AR SL-1200P 80+P FM", marca: "ASROCK", potenciaWatts: 1200, certificacion80Plus: "Platinum", esModular: true, factorForma: "ATX", precio: 253.51, stock: 3, subcategoria: "80+ Platinum" },
      { nombre: "PSU AR 1650W FM 80+T TC-1650T", marca: "ASROCK", potenciaWatts: 1650, certificacion80Plus: "Titanium", esModular: true, factorForma: "ATX", precio: 615.53, stock: 1, subcategoria: "80+ Titanium" },
      // ASUS
      { nombre: "PSU AS AP-850G FM 80+ GOLD", marca: "ASUS", potenciaWatts: 850, certificacion80Plus: "Gold", esModular: true, factorForma: "ATX", precio: 144.59, stock: 5, subcategoria: "80+ Gold" },
      { nombre: "PSU AS ROG STRIX 1000P GM 80+P", marca: "ASUS", potenciaWatts: 1000, certificacion80Plus: "Platinum", esModular: true, factorForma: "ATX", precio: 292.64, stock: 3, subcategoria: "80+ Platinum" },
      { nombre: "PSU AS ROG THOR 1200P3 GREY", marca: "ASUS", potenciaWatts: 1200, certificacion80Plus: "Platinum", esModular: true, factorForma: "ATX", precio: 569.51, stock: 2, subcategoria: "80+ Platinum" },
      { nombre: "PSU AS TUF GAMING 1000G WHITE", marca: "ASUS", potenciaWatts: 1000, certificacion80Plus: "Gold", esModular: true, factorForma: "ATX", precio: 212.09, stock: 4, subcategoria: "80+ Gold" },
      { nombre: "PSU AS TUF-GAMING-750G 80+G", marca: "ASUS", potenciaWatts: 750, certificacion80Plus: "Gold", esModular: true, factorForma: "ATX", precio: 143.05, stock: 6, subcategoria: "80+ Gold" },
      // GIGABYTE
      { nombre: "PSU GB P650G PG5 80+ GOLD", marca: "GIGABYTE", potenciaWatts: 650, certificacion80Plus: "Gold", esModular: false, factorForma: "ATX", precio: 72.5, stock: 10, subcategoria: "80+ Gold" },
      { nombre: "PSU GB P750BS 750W 80P BRONZE", marca: "GIGABYTE", potenciaWatts: 750, certificacion80Plus: "Bronze", esModular: false, factorForma: "ATX", precio: 90.14, stock: 8, subcategoria: "80+ Bronze" },
      // MSI
      { nombre: "PSU MS A1200PLS PCIE5 80+P", marca: "MSI", potenciaWatts: 1200, certificacion80Plus: "Platinum", esModular: true, factorForma: "ATX", precio: 205.95, stock: 3, subcategoria: "80+ Platinum" },
      { nombre: "PSU MSI MAG A750BN PCIE5 III", marca: "MSI", potenciaWatts: 750, certificacion80Plus: "Bronze", esModular: false, factorForma: "ATX", precio: 85.54, stock: 8, subcategoria: "80+ Bronze" },
      // TEROS
      { nombre: "PSU GM ATX 650W TE1325 BK", marca: "TEROS", potenciaWatts: 650, certificacion80Plus: "Bronze", esModular: false, factorForma: "ATX", precio: 52.55, stock: 12, subcategoria: "80+ Bronze" },
      { nombre: "PSU GM ATX 850W TE1320S", marca: "TEROS", potenciaWatts: 850, certificacion80Plus: "Platinum", esModular: true, factorForma: "ATX", precio: 95.51, stock: 6, subcategoria: "80+ Platinum" },
    ],
  });
  console.log("  ✓ PSUs: 15 products");

  // ── SSDs (16 products) ────────────────────────────────────
  await prisma.ssd.createMany({
    data: [
      // SATA 2.5"
      { nombre: "SSD HIK C200 256GB SATA 2.5", marca: "HIKSEMI", capacidadGB: 256, formato: "SATA 2.5\"", interfaz: "SATA III", lecturaMBs: 550, escrituraMBs: 510, precio: 25.76, stock: 20, subcategoria: "SSD SATA 2.5\"" },
      { nombre: "SSD HIK C200 512GB SATA 2.5", marca: "HIKSEMI", capacidadGB: 512, formato: "SATA 2.5\"", interfaz: "SATA III", lecturaMBs: 550, escrituraMBs: 510, precio: 43.19, stock: 15, subcategoria: "SSD SATA 2.5\"" },
      { nombre: "SSD HIK C200 1TB SATA 2.5", marca: "HIKSEMI", capacidadGB: 1024, formato: "SATA 2.5\"", interfaz: "SATA III", lecturaMBs: 550, escrituraMBs: 510, precio: 81.18, stock: 10, subcategoria: "SSD SATA 2.5\"" },
      { nombre: "SSD TF VULCAN G4 512G 2.5 SATA", marca: "TEAMGROUP", capacidadGB: 512, formato: "SATA 2.5\"", interfaz: "SATA III", lecturaMBs: 560, escrituraMBs: 530, precio: 49.66, stock: 12, subcategoria: "SSD SATA 2.5\"" },
      { nombre: "SSD TF VULCAN G4 1TB 2.5 SATA", marca: "TEAMGROUP", capacidadGB: 1024, formato: "SATA 2.5\"", interfaz: "SATA III", lecturaMBs: 560, escrituraMBs: 530, precio: 89.8, stock: 8, subcategoria: "SSD SATA 2.5\"" },
      { nombre: "SSD KINGSTON A400 240G 2.5 SATA", marca: "KINGSTON", capacidadGB: 240, formato: "SATA 2.5\"", interfaz: "SATA III", lecturaMBs: 500, escrituraMBs: 320, precio: 29.68, stock: 15, subcategoria: "SSD SATA 2.5\"" },
      { nombre: "SSD KINGSTON A400 480G 2.5 SATA", marca: "KINGSTON", capacidadGB: 480, formato: "SATA 2.5\"", interfaz: "SATA III", lecturaMBs: 500, escrituraMBs: 320, precio: 44.12, stock: 12, subcategoria: "SSD SATA 2.5\"" },
      // NVMe M.2
      { nombre: "SSD HIK C3000 512G M.2 NVMe", marca: "HIKSEMI", capacidadGB: 512, formato: "M.2 2280", interfaz: "NVMe PCIe Gen3", lecturaMBs: 2100, escrituraMBs: 1700, precio: 41.82, stock: 12, subcategoria: "SSD NVMe M.2" },
      { nombre: "SSD HIK C3000 1TB M.2 NVMe", marca: "HIKSEMI", capacidadGB: 1024, formato: "M.2 2280", interfaz: "NVMe PCIe Gen3", lecturaMBs: 2100, escrituraMBs: 1700, precio: 69.05, stock: 10, subcategoria: "SSD NVMe M.2" },
      { nombre: "SSD HIK C5000 1TB M.2 NVMe", marca: "HIKSEMI", capacidadGB: 1024, formato: "M.2 2280", interfaz: "NVMe PCIe Gen4", lecturaMBs: 5000, escrituraMBs: 4500, precio: 81.3, stock: 8, subcategoria: "SSD NVMe M.2" },
      { nombre: "SSD TF DEEP MX500 500G M.2 NVMe", marca: "TEAMGROUP", capacidadGB: 500, formato: "M.2 2280", interfaz: "NVMe PCIe Gen3", lecturaMBs: 2100, escrituraMBs: 1700, precio: 44.14, stock: 10, subcategoria: "SSD NVMe M.2" },
      { nombre: "SSD TF DEEP MX500 1TB M.2 NVMe", marca: "TEAMGROUP", capacidadGB: 1024, formato: "M.2 2280", interfaz: "NVMe PCIe Gen3", lecturaMBs: 2100, escrituraMBs: 1700, precio: 74.15, stock: 8, subcategoria: "SSD NVMe M.2" },
      { nombre: "SSD XPG GAMMIX S65 512G M.2 NVMe", marca: "ADATA", capacidadGB: 512, formato: "M.2 2280", interfaz: "NVMe PCIe Gen4", lecturaMBs: 5000, escrituraMBs: 4000, precio: 51.86, stock: 8, subcategoria: "SSD NVMe M.2" },
      { nombre: "SSD XPG GAMMIX S65 1TB M.2 NVMe", marca: "ADATA", capacidadGB: 1024, formato: "M.2 2280", interfaz: "NVMe PCIe Gen4", lecturaMBs: 5000, escrituraMBs: 4000, precio: 80.68, stock: 6, subcategoria: "SSD NVMe M.2" },
      { nombre: "SSD KINGSTON NV3 500G M.2 NVMe", marca: "KINGSTON", capacidadGB: 500, formato: "M.2 2280", interfaz: "NVMe PCIe Gen4", lecturaMBs: 6000, escrituraMBs: 3000, precio: 47.12, stock: 10, subcategoria: "SSD NVMe M.2" },
      { nombre: "SSD KINGSTON NV3 1TB M.2 NVMe", marca: "KINGSTON", capacidadGB: 1024, formato: "M.2 2280", interfaz: "NVMe PCIe Gen4", lecturaMBs: 6000, escrituraMBs: 4000, precio: 78.2, stock: 8, subcategoria: "SSD NVMe M.2" },
    ],
  });
  console.log("  ✓ SSDs: 16 products");

  // ── Monitors (23 products) ────────────────────────────────
  await prisma.monitor.createMany({
    data: [
      // Curved FHD VA
      { nombre: "MON GB 23.6\" FHD 165HZ VA CURVO", marca: "GIGABYTE", tamano: "23.6\"", resolucion: "FHD (1920 x 1080)", tipoPanel: "VA", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 165, puertos: "HDMI, DisplayPort", precio: 123.62, stock: 8, subcategoria: "Curvo FHD" },
      { nombre: "MON GB 24\" FHD 180HZ VA CURVO", marca: "GIGABYTE", tamano: "24\"", resolucion: "FHD (1920 x 1080)", tipoPanel: "VA", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 180, puertos: "HDMI, DisplayPort", precio: 140.56, stock: 6, subcategoria: "Curvo FHD" },
      // Curved QHD VA
      { nombre: "MON GB 27\" QHD 170HZ VA CURVO", marca: "GIGABYTE", tamano: "27\"", resolucion: "QHD (2560 x 1440)", tipoPanel: "VA", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 170, puertos: "HDMI, DisplayPort", precio: 188.15, stock: 5, subcategoria: "Curvo QHD" },
      { nombre: "MON MS 27\" QHD 180HZ VA CURVO", marca: "MSI", tamano: "27\"", resolucion: "QHD (2560 x 1440)", tipoPanel: "VA", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 180, puertos: "HDMI, DisplayPort", precio: 198.41, stock: 4, subcategoria: "Curvo QHD" },
      { nombre: "MON AOC CQ27G3S 27\" QHD 180 VA", marca: "AOC", tamano: "27\"", resolucion: "QHD (2560 x 1440)", tipoPanel: "VA", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 180, puertos: "HDMI, DisplayPort", precio: 190.19, stock: 5, subcategoria: "Curvo QHD" },
      { nombre: "MON AOC CQ27G4 27\" QHD 180 VA", marca: "AOC", tamano: "27\"", resolucion: "QHD (2560 x 1440)", tipoPanel: "VA", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 180, puertos: "HDMI, DisplayPort", precio: 190.19, stock: 4, subcategoria: "Curvo QHD" },
      // Flat FHD IPS
      { nombre: "MON GB 23.8\" FHD 100HZ IPS", marca: "GIGABYTE", tamano: "23.8\"", resolucion: "FHD (1920 x 1080)", tipoPanel: "IPS", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 100, puertos: "HDMI, VGA", precio: 99.25, stock: 10, subcategoria: "Plano FHD" },
      { nombre: "MON MS 23.8\" FHD 100HZ IPS", marca: "MSI", tamano: "23.8\"", resolucion: "FHD (1920 x 1080)", tipoPanel: "IPS", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 100, puertos: "HDMI, VGA", precio: 100.74, stock: 8, subcategoria: "Plano FHD" },
      { nombre: "MON AOC 24B2XH 23.8\" FHD IPS", marca: "AOC", tamano: "23.8\"", resolucion: "FHD (1920 x 1080)", tipoPanel: "IPS", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 100, puertos: "HDMI, VGA", precio: 99.92, stock: 10, subcategoria: "Plano FHD" },
      { nombre: "MON AOC 24G2SP 23.8\" FHD 165 IPS", marca: "AOC", tamano: "23.8\"", resolucion: "FHD (1920 x 1080)", tipoPanel: "IPS", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 165, puertos: "HDMI, DisplayPort", precio: 142.49, stock: 6, subcategoria: "Plano FHD" },
      // Flat QHD IPS
      { nombre: "MON AOC Q27B3MA 27\" QHD 100 VA", marca: "AOC", tamano: "27\"", resolucion: "QHD (2560 x 1440)", tipoPanel: "VA", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 100, puertos: "HDMI, DisplayPort", precio: 161.26, stock: 5, subcategoria: "Plano QHD" },
      { nombre: "MON GB M27Q P 27\" QHD 170 IPS", marca: "GIGABYTE", tamano: "27\"", resolucion: "QHD (2560 x 1440)", tipoPanel: "IPS", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 170, puertos: "HDMI, DisplayPort", precio: 208.43, stock: 4, subcategoria: "Plano QHD" },
      { nombre: "MON AOC CQ27G3S 27\" QHD 180 IPS", marca: "AOC", tamano: "27\"", resolucion: "QHD (2560 x 1440)", tipoPanel: "IPS", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 180, puertos: "HDMI, DisplayPort", precio: 211.56, stock: 3, subcategoria: "Plano QHD" },
      { nombre: "MON MS 27\" QHD 180HZ IPS", marca: "MSI", tamano: "27\"", resolucion: "QHD (2560 x 1440)", tipoPanel: "IPS", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 180, puertos: "HDMI, DisplayPort", precio: 221.82, stock: 4, subcategoria: "Plano QHD" },
      // Flat UHD IPS
      { nombre: "MON GB 28\" UHD 144HZ IPS", marca: "GIGABYTE", tamano: "28\"", resolucion: "UHD (3840 x 2160)", tipoPanel: "IPS", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 144, puertos: "HDMI, DisplayPort", precio: 290.74, stock: 3, subcategoria: "Plano UHD" },
      { nombre: "MON AOC U28G2X 28\" UHD 144 IPS", marca: "AOC", tamano: "28\"", resolucion: "UHD (3840 x 2160)", tipoPanel: "IPS", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 144, puertos: "HDMI, DisplayPort", precio: 274.63, stock: 3, subcategoria: "Plano UHD" },
      { nombre: "MON AS 27\" UHD 144HZ IPS VG27AQ3A", marca: "ASUS", tamano: "27\"", resolucion: "UHD (3840 x 2160)", tipoPanel: "IPS", ratioAspecto: "16:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 144, puertos: "HDMI, DisplayPort", precio: 379.69, stock: 2, subcategoria: "Plano UHD" },
      // Ultra-wide
      { nombre: "MON GB 34\" UWQHD 180HZ VA CURVO", marca: "GIGABYTE", tamano: "34\"", resolucion: "UWQHD (3440 x 1440)", tipoPanel: "VA", ratioAspecto: "21:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 180, puertos: "HDMI, DisplayPort", precio: 352.78, stock: 3, subcategoria: "Ultrawide" },
      { nombre: "MON AS 34\" UWQHD 180HZ VA CURVO", marca: "ASUS", tamano: "34\"", resolucion: "UWQHD (3440 x 1440)", tipoPanel: "VA", ratioAspecto: "21:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 180, puertos: "HDMI, DisplayPort", precio: 347.17, stock: 2, subcategoria: "Ultrawide" },
      { nombre: "MON AOC CU34G2X 34\" UWQHD 144 VA", marca: "AOC", tamano: "34\"", resolucion: "UWQHD (3440 x 1440)", tipoPanel: "VA", ratioAspecto: "21:9", tiempoRespuestaMs: 1, tasaRefrescoHz: 144, puertos: "HDMI, DisplayPort", precio: 347.17, stock: 3, subcategoria: "Ultrawide" },
    ],
  });
  console.log("  ✓ Monitors: 20 products");

  console.log("\n✅ Seed complete: 159 products across 9 categories (from PRODUCTOS.md)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
