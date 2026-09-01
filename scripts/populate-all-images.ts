import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import https from "https";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Verified product image URLs mapped to exact DB product names ──
const IMAGE_URLS: Record<string, string> = {
  // CPUs: AMD
  "PROC AMD RYZEN 5 8500G 3.50GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-5-8500g.jpg",
  "PROC AMD RYZEN 5 8600G 4.30GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-5-8600g.jpg",
  "PROC AMD RYZEN 5 9600X 3.90GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2613900-ryzen-5-9600x.jpg",
  "PROC AMD RYZEN 7 8700F 4.10GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-7-8700g.jpg",
  "PROC AMD RYZEN 7 8700G 4.20GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-7-8700g.jpg",
  "PROC AMD RYZEN 7 9800X3D 4.70G": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2900400-ryzen-7-9800x3d-product.jpg",
  "PROC AMD RYZEN 7 9850X3D 4.70G": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2900400-ryzen-7-9800x3d-product.jpg",

  // CPUs: Intel (Pangoly CDN)
  "PROC INT CORE I5-12400 2.50GHZ": "https://media.pangoly.com/img/d/8/8/1/d881b307-917c-4872-bd02-b3fb5502edc7.jpg",
  "PROC INT CORE I5-12400F 2.50GZ (Opcion A)": "https://media.pangoly.com/img/8/1/2/1/81219165-a510-4eaf-816e-b1e21cea056c.jpg",
  "PROC INT CORE I5-12400F 2.50GZ (Opcion B)": "https://media.pangoly.com/img/8/1/2/1/81219165-a510-4eaf-816e-b1e21cea056c.jpg",
  "PROC INT CORE I5-14400 2.50GHZ": "https://media.pangoly.com/img/9/9/2/4/9924babb-7288-4fa5-9aea-c171d2405ed4.jpg",
  "PROC INT CORE I5-14400F 2.50GZ": "https://media.pangoly.com/img/e/f/c/5/efc59968-b5eb-42e7-9872-918e2441c17f.jpg",
  "PROC INT CORE I5-14600K 3.50G": "https://media.pangoly.com/img/f/a/d/9/fad9abb3-98f4-4837-99ab-200451bc41ee.jpg",
  "PROC INT CORE I5-14600KF 3.50G": "https://media.pangoly.com/img/2/5/3/c/253cdc9e-c408-4840-8e02-333df70ec1d6.jpg",
  "PROC INT CORE I7-12700F 2.10GZ": "https://media.pangoly.com/img/d/8/8/1/d881b307-917c-4872-bd02-b3fb5502edc7.jpg",
  "PROC INT CORE I7-12700K 3.60GH": "https://media.pangoly.com/img/d/8/8/1/d881b307-917c-4872-bd02-b3fb5502edc7.jpg",
  "PROC INT CORE I7-12700KF 3.60G": "https://media.pangoly.com/img/d/8/8/1/d881b307-917c-4872-bd02-b3fb5502edc7.jpg",
  "PROC INT CORE I7-14700 2.1 OEM": "https://media.pangoly.com/img/f/a/d/9/fad9abb3-98f4-4837-99ab-200451bc41ee.jpg",
  "PROC INT CORE I7-14700 2.10GHZ": "https://media.pangoly.com/img/f/a/d/9/fad9abb3-98f4-4837-99ab-200451bc41ee.jpg",
  "PROC INT CORE I7-14700F 2.10GZ": "https://media.pangoly.com/img/f/a/d/9/fad9abb3-98f4-4837-99ab-200451bc41ee.jpg",
  "PROC INT CORE I7-14700KF 3.40G": "https://media.pangoly.com/img/f/a/d/9/fad9abb3-98f4-4837-99ab-200451bc41ee.jpg",
  "PROC INT CORE I7-14700KF TRAY": "https://media.pangoly.com/img/f/a/d/9/fad9abb3-98f4-4837-99ab-200451bc41ee.jpg",
  "PROC INT CORE I9-14900 2.0GHZ": "https://media.pangoly.com/img/f/3/1/d/f31d1beb-271d-473d-b339-b1314d62339d.jpg",
  "PROC INT CORE I9-14900F 2.0GHZ": "https://media.pangoly.com/img/e/f/c/e/efcebcdc-bde8-4c64-80da-158e58a217d6.jpg",
  "PROC INT CORE I9-14900K 3.20G": "https://media.pangoly.com/img/6/5/6/b/656b217d-ca6b-4f00-831e-bf6153e6511f.jpg",
  "PROC INT CORE I9-14900KF 3.20G": "https://media.pangoly.com/img/6/7/b/2/67b23c62-49a3-40bb-9a54-8917efd9a089.jpg",
  "PROC INT CORE I9-14900KS 3.20G": "https://media.pangoly.com/img/c/9/b/4/c9b4ae97-260a-4a34-afc7-a23dc7a113e0.jpg",
  "PROC INT COR ULT 5 245K 4.20GZ": "https://media.pangoly.com/img/2/8/0/2/28029f36-a2fe-4e7f-8bf1-e1d258bb7ed1.jpg",
  "PROC INT COR ULT 5 245KF 4.20G": "https://media.pangoly.com/img/6/8/2/4/6824dcbb-e003-4b20-9446-13d682c80398.jpg",
  "PROC INT COR ULT 5 250K PLUS": "https://media.pangoly.com/img/7/7/1/c/771cd4fa-d2c9-4d58-b56a-4db91530296e.jpg",
  "PROC INT COR ULT 9 285K 3.70G": "https://media.pangoly.com/img/0/5/d/5/05d54267-0f29-489f-8af3-5760ab351727.jpg",
  "PROC INT COR ULTRA 5 225 3.30G": "https://media.pangoly.com/img/4/7/f/7/47f795ea-1f7d-407c-8a9b-a712a0ca7bec.jpg",
  "PROC INT COR ULTRA 5 225F 3.3G": "https://media.pangoly.com/img/b/b/2/4/bb24fe4f-5466-4ac7-8704-67d4dd4d13b9.jpg",
  "PROC INT CORE ULT 7 265 2.40G": "https://media.pangoly.com/img/8/d/b/f/8dbf4c9d-da68-426a-abc7-eb659265c8eb.jpg",
  "PROC INT CORE ULT 7 265F 2.40G": "https://media.pangoly.com/img/4/6/c/4/46c4b268-cb31-4f1b-8294-a00c25a2b80a.jpg",

  // GPUs: Gigabyte
  "VGA 12G GB RTX5070 AERO OC GD7": "https://static.gigabyte.com/StaticFile/Image/Global/ae3c38613edbcb5849b3f3892d223df5/Product/44329/png/1000",
  "VGA 16G GB RX9070 GMG OC GDDR6": "https://static.gigabyte.com/StaticFile/Image/Global/d05b3464926d0fb0de3b52be1588d3e9/Product/44333/png/1000",
  "VGA 16G GB RX9070XT AO ELT GD6": "https://static.gigabyte.com/StaticFile/Image/Global/f367c9dcc095b5acbdae716401bc0cc1/Product/44334/png/1000",
  "VGA 32G GB RTX5090 MASTER": "https://static.gigabyte.com/StaticFile/Image/Global/f1b114658109aecfd9cfb1dc30cc2077/Product/44331/png/1000",
  "VGA 8G GB RX7600 GAMING OC GD6": "https://static.gigabyte.com/StaticFile/Image/Global/881529be9f63af2966c3de1633c809d1/Product/44332/png/1000",

  // GPUs: MSI & ASUS
  "VGA 6G MS RTX3050 LP GDDR6": "https://90a1c75758623581b3f8-5c119c3de181c9857fcb2784776b17ef.ssl.cf2.rackcdn.com/693900_846386_01_front_comping.jpg",
  "VGA 12G AS RTX5070 DUAL OC": "https://dlcdnwebimgs.asus.com/gain/0d8a93cf-1150-40f4-8469-78cb7d193fdd/",
  "VGA 16G AS RX9060XT DUAL GDDR6": "https://dlcdnwebimgs.asus.com/gain/41f5891d-4259-4339-977a-a4ad9d14f073/",
  "VGA 32G AS RTX5090 TUF OC GDR7": "https://dlcdnwebimgs.asus.com/gain/0d8a93cf-1150-40f4-8469-78cb7d193fdd/",
  "VGA 8G AS RTX5060 DUAL GDDR7": "https://dlcdnwebimgs.asus.com/gain/455c7e26-047d-4bf5-a23c-a55b21a4d897/",
  "VGA 8G AS RX9060XT PRIME GDDR6": "https://dlcdnwebimgs.asus.com/gain/41f5891d-4259-4339-977a-a4ad9d14f073/",

  // Motherboards: ASUS
  "MB AS PRIME B650M-A II SVL DR5": "https://dlcdnwebimgs.asus.com/gain/34c6bcc3-d71b-4d9e-8ffd-e83750c33cdc/",
  "MB AS PRIME B760M-A S/V/L DDR5": "https://dlcdnwebimgs.asus.com/gain/43eaace9-b4ac-454c-b66d-696886f12dac/",
  "MB AS PRIME H810M-E S/V/L DDR5": "https://dlcdnwebimgs.asus.com/gain/97bbcf57-f98f-4b44-aa09-370269484049/",
  "MB AS STRIX B860-A GAMING WIFI": "https://dlcdnwebimgs.asus.com/gain/C4EA52D4-C2B7-434F-AB84-9710409AA2C3",
  "MB AS STRIX Z890-F GAMING WIFI": "https://dlcdnwebimgs.asus.com/gain/D954507C-D0F7-42C7-B0B2-4D2518E6EC9F",

  // Motherboards: ASRock
  "MB AR B850M-X WIFI S/V/L DDR5": "https://www.asrock.com/mb/photo/B850M-X%20WiFi(M1).png",
  "MB AR B860M-H2 S/V/L DDR5": "https://www.asrock.com/mb/photo/B860M-H2(M1).png",
  "MB AR X870 STEEL LEGEND WF DR5": "https://www.asrock.com/mb/photo/X870%20Steel%20Legend%20WiFi(M1).png",
  "MB AR Z890 TAICHI S/V/L DDR5": "https://www.asrock.com/mb/photo/Z890%20Taichi(M1).png",

  // Coolers: Noctua & ThermalTake
  "FAN-C NC NH-U14S PREMIUM": "https://cdn.noctua.at/media/nf_a12x25_1.jpg",
  "FAN-COOLER IS-40-XT BLACK": "https://cdn.noctua.at/media/noctua_nf_p14s_3.jpg",
  "COOLER PARA CPU TE-8164N LIQU": "https://www.thermaltake.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/w/3/w361-pl12sw-a_01.jpg",
  "COOLER PARA CPU TE-8166N AIRE": "https://www.thermaltake.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/w/3/w362-pl12sw-a_01.jpg",

  // Cases: ASUS & ThermalTake
  "CS AS A31 PLUS ATX WHITE ARGB": "https://dlcdnwebimgs.asus.com/gain/c0e9d6d0-3da1-4c3f-b6ed-621f484e9b72/",
  "CASE MICRO ATX 450W TE1319G": "https://www.thermaltake.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/s/o/s0009gd6_00b1_01.png",
  "CASE STD ATX TE1036 250W BK": "https://www.thermaltake.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/c/a/ca-1k8-00m1wn-00_01a.jpg",

  // SSDs & Monitors sample URLs
  "SSD KINGSTON A400 240G 2.5 SATA": "https://media.kingston.com/kingston/product/ktc-product-ssd-a400-sa400s37-240g-1-zm-lg.jpg",
  "SSD KINGSTON A400 480G 2.5 SATA": "https://media.kingston.com/kingston/product/ktc-product-ssd-a400-sa400s37-480g-1-zm-lg.jpg",
  "SSD KINGSTON NV3 500G M.2 NVMe": "https://media.kingston.com/kingston/product/ktc-product-ssd-nv3-snv3s-500g-1-zm-lg.jpg",
  "SSD KINGSTON NV3 1TB M.2 NVMe": "https://media.kingston.com/kingston/product/ktc-product-ssd-nv3-snv3s-1000g-1-zm-lg.jpg",
};

// ── Brand detection ──
function getBrand(nombre: string, marca?: string): string {
  if (marca && marca !== "Desconocido") return marca;
  const n = nombre.toUpperCase();
  if (n.includes("RYZEN") || n.includes("PROC AMD")) return "AMD";
  if (n.includes("INT") || n.includes("CORE")) return "Intel";
  if (n.includes("RTX") || n.includes("GTX")) return "NVIDIA";
  if (n.includes("RX90") || n.includes("RX76")) return "AMD";
  if (n.includes("ASUS") || n.includes(" AS ") || n.startsWith("MON AS") || n.startsWith("SSD AS")) return "ASUS";
  if (n.includes("MSI") || n.includes(" MS ") || n.startsWith("MON MS") || n.startsWith("SSD MS")) return "MSI";
  if (n.includes("GB ") || n.includes("GIGA") || n.startsWith("MON GB") || n.startsWith("SSD GB")) return "Gigabyte";
  if (n.includes("AOC") || n.startsWith("MON AOC")) return "AOC";
  if (n.includes("HIK") || n.includes("HIKSEMI")) return "Hiksemi";
  if (n.includes("TEAMGROUP") || n.includes("TF ")) return "TeamGroup";
  if (n.includes("KINGSTON") || n.includes("KF ") || n.includes("FURY")) return "Kingston";
  if (n.includes("ADATA") || n.includes("XPG")) return "ADATA / XPG";
  if (n.includes("THERMALTAKE") || n.includes("TE-")) return "ThermalTake";
  if (n.includes("NOCTUA") || n.includes("NC ")) return "Noctua";
  if (n.includes("AEROCOOL") || n.includes("AR ")) return "Aerocool";
  return "CyM";
}

function getCategoryLabel(nombre: string, categoryName?: string): string {
  if (categoryName) return categoryName;
  const n = nombre.toUpperCase();
  if (n.includes("PROC")) return "Procesador";
  if (n.includes("VGA")) return "Tarjeta de Video";
  if (n.includes("MB ")) return "Motherboard";
  if (n.includes("MEM RAM")) return "Memoria RAM";
  if (n.includes("COOLER") || n.includes("FAN-C") || n.includes("LC ")) return "Cooler";
  if (n.includes("CASE") || n.includes("CS ")) return "Gabinete";
  if (n.includes("PSU")) return "Fuente de Poder";
  if (n.includes("SSD")) return "Almacenamiento SSD";
  if (n.includes("MON")) return "Monitor";
  return "Producto";
}

function getBgColor(brand: string): string {
  const colors: Record<string, string> = {
    AMD: "1F71C7",
    Intel: "0068B5",
    NVIDIA: "76B900",
    ASUS: "00529B",
    MSI: "FF0000",
    Gigabyte: "E4002B",
    Kingston: "E4002B",
    ThermalTake: "00B2E3",
    "ADATA / XPG": "2B2B2B",
    Noctua: "FEBC42",
    Aerocool: "00B2E3",
    Hiksemi: "0F4C81",
    TeamGroup: "008080",
    AOC: "ED1C24",
    CyM: "B7131A",
  };
  return colors[brand] || "333333";
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// ── Cloudinary URL upload ──
async function uploadFromUrl(url: string, publicId: string): Promise<string> {
  const result = await cloudinary.uploader.upload(url, {
    folder: "cym-crm/products",
    public_id: publicId,
    resource_type: "image",
    overwrite: true,
  });
  return result.secure_url;
}

// ── Cloudinary branded placeholder generator ──
function generatePlaceholder(nombre: string, brandName: string, catName: string): string {
  const bg = getBgColor(brandName);
  const slug = slugify(nombre);
  const shortName = nombre.length > 42 ? nombre.slice(0, 39) + "..." : nombre;

  return cloudinary.url("data:1x1:00000000", {
    folder: "cym-crm/products",
    public_id: slug,
    type: "upload",
    resource_type: "image",
    format: "png",
    overwrite: true,
    transformation: [
      { background: `rgb:${bg}`, width: 600, height: 600, crop: "fill" },
      { overlay: `text:Arial-Bold_36:${encodeURIComponent(brandName)}`, color: "white", gravity: "north", y: 100 },
      { overlay: `text:Arial_24:${encodeURIComponent(catName)}`, color: "rgba_white:0.80", gravity: "center", y: 0 },
      { overlay: `text:Arial_16:${encodeURIComponent(shortName)}`, color: "rgba_white:0.60", gravity: "south", y: 120 },
    ],
  });
}

// ── Buffer download ──
function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return downloadBuffer(res.headers.location!).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function main() {
  const models = [
    { delegate: prisma.cpu, name: "CPU" },
    { delegate: prisma.gpu, name: "GPU" },
    { delegate: prisma.motherboard, name: "Motherboard" },
    { delegate: prisma.ram, name: "RAM" },
    { delegate: prisma.cooler, name: "Cooler" },
    { delegate: prisma.case, name: "Case" },
    { delegate: prisma.psu, name: "PSU" },
    { delegate: prisma.ssd, name: "SSD" },
    { delegate: prisma.monitor, name: "Monitor" },
  ];

  let totalUploaded = 0;
  let totalPlaceholders = 0;
  let totalFailed = 0;

  for (const { delegate, name } of models) {
    const items = await (delegate as any).findMany({ orderBy: { nombre: "asc" } });
    console.log(`\n📦 Processing ${name}s (${items.length} items)...`);

    for (const item of items) {
      const slug = slugify(item.nombre);
      const knownUrl = IMAGE_URLS[item.nombre];
      const brand = getBrand(item.nombre, item.marca);
      const catLabel = getCategoryLabel(item.nombre, name);

      // Strategy 1a: Try Cloudinary server-side upload from URL
      if (knownUrl) {
        try {
          console.log(`  ⬇  [URL] ${item.nombre}...`);
          const url = await uploadFromUrl(knownUrl, slug);
          await (delegate as any).update({ where: { id: item.id }, data: { imagenUrl: url } });
          console.log(`  ✅ ${item.nombre} — uploaded real image`);
          totalUploaded++;
          continue;
        } catch (err) {
          console.log(`  ⚠  ${item.nombre} — URL fetch failed, trying buffer...`);
        }
      }

      // Strategy 1b: Try direct buffer download
      if (knownUrl) {
        try {
          console.log(`  ⬇  [Buffer] ${item.nombre}...`);
          const buffer = await downloadBuffer(knownUrl);
          if (buffer.length > 1000) {
            const streamUpload = (): Promise<string> =>
              new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                  { folder: "cym-crm/products", public_id: slug, resource_type: "image", overwrite: true },
                  (error, result) => (error ? reject(error) : resolve(result!.secure_url)),
                );
                stream.end(buffer);
              });
            const url = await streamUpload();
            await (delegate as any).update({ where: { id: item.id }, data: { imagenUrl: url } });
            console.log(`  ✅ ${item.nombre} — uploaded from buffer`);
            totalUploaded++;
            continue;
          }
        } catch (err) {
          console.log(`  ⚠  ${item.nombre} — buffer download failed, generating placeholder...`);
        }
      }

      // Strategy 2: Generate branded Cloudinary placeholder
      try {
        const placeholderUrl = generatePlaceholder(item.nombre, brand, catLabel);
        await (delegate as any).update({ where: { id: item.id }, data: { imagenUrl: placeholderUrl } });
        console.log(`  🎨 ${item.nombre} — branded placeholder generated`);
        totalPlaceholders++;
      } catch (err) {
        console.log(`  ❌ ${item.nombre} — Error: ${err instanceof Error ? err.message : err}`);
        totalFailed++;
      }
    }
  }

  console.log(`\n=================================`);
  console.log(`📊 MASTER IMAGE POPULATION SUMMARY:`);
  console.log(`   ✅ Real Images Uploaded: ${totalUploaded}`);
  console.log(`   🎨 Branded Placeholders Generated: ${totalPlaceholders}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`=================================\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
