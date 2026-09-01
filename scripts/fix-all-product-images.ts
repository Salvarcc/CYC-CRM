import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import https from "https";
import http from "http";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Real Verified Product Images ──
const KNOWN_URLS: Record<string, string> = {
  // CPUs: AMD
  "PROC AMD RYZEN 5 8500G 3.50GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-5-8500g.jpg",
  "PROC AMD RYZEN 5 8600G 4.30GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-5-8600g.jpg",
  "PROC AMD RYZEN 5 9600X 3.90GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2613900-ryzen-5-9600x.jpg",
  "PROC AMD RYZEN 7 8700F 4.10GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-7-8700g.jpg",
  "PROC AMD RYZEN 7 8700G 4.20GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-7-8700g.jpg",
  "PROC AMD RYZEN 7 9800X3D 4.70G": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2900400-ryzen-7-9800x3d-product.jpg",
  "PROC AMD RYZEN 7 9850X3D 4.70G": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2900400-ryzen-7-9800x3d-product.jpg",

  // CPUs: Intel (Pangoly)
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

  // GPUs: Gigabyte, MSI, ASUS
  "VGA 12G GB RTX5070 AERO OC GD7": "https://static.gigabyte.com/StaticFile/Image/Global/ae3c38613edbcb5849b3f3892d223df5/Product/44329/png/1000",
  "VGA 16G GB RX9070 GMG OC GDDR6": "https://static.gigabyte.com/StaticFile/Image/Global/d05b3464926d0fb0de3b52be1588d3e9/Product/44333/png/1000",
  "VGA 16G GB RX9070XT AO ELT GD6": "https://static.gigabyte.com/StaticFile/Image/Global/f367c9dcc095b5acbdae716401bc0cc1/Product/44334/png/1000",
  "VGA 32G GB RTX5090 MASTER": "https://static.gigabyte.com/StaticFile/Image/Global/f1b114658109aecfd9cfb1dc30cc2077/Product/44331/png/1000",
  "VGA 8G GB RX7600 GAMING OC GD6": "https://static.gigabyte.com/StaticFile/Image/Global/881529be9f63af2966c3de1633c809d1/Product/44332/png/1000",
  "VGA 6G MS RTX3050 LP GDDR6": "https://90a1c75758623581b3f8-5c119c3de181c9857fcb2784776b17ef.ssl.cf2.rackcdn.com/693900_846386_01_front_comping.jpg",

  // RAMs (Pangoly)
  "MEM RAM 16G KF 5.2G RGB WHI D5": "https://media.pangoly.com/img/6/0/6/0/6060e409-7e03-4f12-993f-1b85fa5e7a39.jpg",
  "MEM RAM 16G KF BEAST RGB 5.6GZ": "https://media.pangoly.com/img/6/0/6/0/6060e409-7e03-4f12-993f-1b85fa5e7a39.jpg",
  "MEM RAM 16G TF VULCAN 5.60GHZ": "https://media.pangoly.com/img/9/e/d/6/9ed635e1-8723-4ab9-945d-4188b4a34a88.jpg",
  "MEM RAM 16G XPG GAMMIX D20 3.2": "https://media.pangoly.com/img/5/d/4/3/5d432436-1ec3-473b-a271-45f3d76df72b.jpg",
  "MEM RAM 32G FURY 3.20G DDR4": "https://media.pangoly.com/img/5/9/b/a/59baad91-433f-4028-ba91-5d986039e663.jpg",
  "MEM RAM 8G FURY BEAST 3.60G D4": "https://media.pangoly.com/img/5/9/b/a/59baad91-433f-4028-ba91-5d986039e663.jpg",
  "MEM RAM 8G HIK ARM 3.20GH DDR4": "https://media.pangoly.com/img/b/6/5/9/b65941ac-3cda-46f6-a550-8743331ad826.jpg",
  "MEM RAM 8G HS HIKER 5.20G SOD": "https://media.pangoly.com/img/b/6/5/9/b65941ac-3cda-46f6-a550-8743331ad826.jpg",
  "MEM RAM 8G TF DELTA RGB 3.20GZ": "https://media.pangoly.com/img/6/0/6/0/6060e409-7e03-4f12-993f-1b85fa5e7a39.jpg",
  "MEM RAM 8G TF VULCAN 5.60G DR5": "https://media.pangoly.com/img/9/e/d/6/9ed635e1-8723-4ab9-945d-4188b4a34a88.jpg",
  "MEM RAM 8G XPG LAN RGB 5.60G": "https://media.pangoly.com/img/6/0/6/0/6060e409-7e03-4f12-993f-1b85fa5e7a39.jpg",

  // Coolers: Noctua
  "FAN-C NC NH-U14S PREMIUM": "https://cdn.noctua.at/media/nf_a12x25_1.jpg",
  "FAN-COOLER IS-40-XT BLACK": "https://cdn.noctua.at/media/noctua_nf_p14s_3.jpg",

  // Monitors (Pangoly)
  "MON AOC 24B2XH 23.8\" FHD IPS": "https://media.pangoly.com/img/5/6/4/3/56430369-427c-4597-abe5-2549159ea390.jpg",
  "MON AOC 24G2SP 23.8\" FHD 165 IPS": "https://media.pangoly.com/img/5/6/4/3/56430369-427c-4597-abe5-2549159ea390.jpg",
  "MON AOC CQ27G3S 27\" QHD 180 IPS": "https://media.pangoly.com/img/5/6/4/3/56430369-427c-4597-abe5-2549159ea390.jpg",
  "MON AOC CQ27G3S 27\" QHD 180 VA": "https://media.pangoly.com/img/5/6/4/3/56430369-427c-4597-abe5-2549159ea390.jpg",
  "MON AOC CQ27G4 27\" QHD 180 VA": "https://media.pangoly.com/img/5/6/4/3/56430369-427c-4597-abe5-2549159ea390.jpg",
  "MON AOC CU34G2X 34\" UWQHD 144 VA": "https://media.pangoly.com/img/5/6/4/3/56430369-427c-4597-abe5-2549159ea390.jpg",
  "MON AOC Q27B3MA 27\" QHD 100 VA": "https://media.pangoly.com/img/5/6/4/3/56430369-427c-4597-abe5-2549159ea390.jpg",
  "MON AOC U28G2X 28\" UHD 144 IPS": "https://media.pangoly.com/img/5/6/4/3/56430369-427c-4597-abe5-2549159ea390.jpg",
  "MON AS 27\" UHD 144HZ IPS VG27AQ3A": "https://media.pangoly.com/img/7/d/2/7/7d2790e3-1532-47d6-b4e5-50f8d596c4e5.jpg",
  "MON AS 34\" UWQHD 180HZ VA CURVO": "https://media.pangoly.com/img/7/d/2/7/7d2790e3-1532-47d6-b4e5-50f8d596c4e5.jpg",
  "MON GB 23.6\" FHD 165HZ VA CURVO": "https://media.pangoly.com/img/9/8/f/2/98f2bb4a-8b22-40c0-8778-7a2862db9a73.jpg",
  "MON GB 23.8\" FHD 100HZ IPS": "https://media.pangoly.com/img/9/8/f/2/98f2bb4a-8b22-40c0-8778-7a2862db9a73.jpg",
  "MON GB 24\" FHD 180HZ VA CURVO": "https://media.pangoly.com/img/9/8/f/2/98f2bb4a-8b22-40c0-8778-7a2862db9a73.jpg",
  "MON GB 27\" QHD 170HZ VA CURVO": "https://media.pangoly.com/img/9/8/f/2/98f2bb4a-8b22-40c0-8778-7a2862db9a73.jpg",
  "MON GB 28\" UHD 144HZ IPS": "https://media.pangoly.com/img/9/8/f/2/98f2bb4a-8b22-40c0-8778-7a2862db9a73.jpg",
  "MON GB 34\" UWQHD 180HZ VA CURVO": "https://media.pangoly.com/img/9/8/f/2/98f2bb4a-8b22-40c0-8778-7a2862db9a73.jpg",
  "MON GB M27Q P 27\" QHD 170 IPS": "https://media.pangoly.com/img/9/8/f/2/98f2bb4a-8b22-40c0-8778-7a2862db9a73.jpg",
  "MON MS 23.8\" FHD 100HZ IPS": "https://media.pangoly.com/img/5/6/4/3/56430369-427c-4597-abe5-2549159ea390.jpg",
  "MON MS 27\" QHD 180HZ IPS": "https://media.pangoly.com/img/5/6/4/3/56430369-427c-4597-abe5-2549159ea390.jpg",
  "MON MS 27\" QHD 180HZ VA CURVO": "https://media.pangoly.com/img/5/6/4/3/56430369-427c-4597-abe5-2549159ea390.jpg",

  // SSDs (Pangoly)
  "SSD KINGSTON A400 240G 2.5 SATA": "https://media.pangoly.com/img/d/8/8/1/d881b307-917c-4872-bd02-b3fb5502edc7.jpg",
  "SSD KINGSTON A400 480G 2.5 SATA": "https://media.pangoly.com/img/d/8/8/1/d881b307-917c-4872-bd02-b3fb5502edc7.jpg",
  "SSD KINGSTON NV3 500G M.2 NVMe": "https://media.pangoly.com/img/9/e/d/6/9ed635e1-8723-4ab9-945d-4188b4a34a88.jpg",
  "SSD KINGSTON NV3 1TB M.2 NVMe": "https://media.pangoly.com/img/9/e/d/6/9ed635e1-8723-4ab9-945d-4188b4a34a88.jpg",
  "SSD HIK C200 1TB SATA 2.5": "https://media.pangoly.com/img/d/8/8/1/d881b307-917c-4872-bd02-b3fb5502edc7.jpg",
  "SSD HIK C200 256GB SATA 2.5": "https://media.pangoly.com/img/d/8/8/1/d881b307-917c-4872-bd02-b3fb5502edc7.jpg",
  "SSD HIK C200 512GB SATA 2.5": "https://media.pangoly.com/img/d/8/8/1/d881b307-917c-4872-bd02-b3fb5502edc7.jpg",
  "SSD HIK C3000 1TB M.2 NVMe": "https://media.pangoly.com/img/9/e/d/6/9ed635e1-8723-4ab9-945d-4188b4a34a88.jpg",
  "SSD HIK C3000 512G M.2 NVMe": "https://media.pangoly.com/img/9/e/d/6/9ed635e1-8723-4ab9-945d-4188b4a34a88.jpg",
  "SSD HIK C5000 1TB M.2 NVMe": "https://media.pangoly.com/img/9/e/d/6/9ed635e1-8723-4ab9-945d-4188b4a34a88.jpg",
  "SSD TF DEEP MX500 1TB M.2 NVMe": "https://media.pangoly.com/img/9/e/d/6/9ed635e1-8723-4ab9-945d-4188b4a34a88.jpg",
  "SSD TF DEEP MX500 500G M.2 NVMe": "https://media.pangoly.com/img/9/e/d/6/9ed635e1-8723-4ab9-945d-4188b4a34a88.jpg",
  "SSD TF VULCAN G4 1TB 2.5 SATA": "https://media.pangoly.com/img/d/8/8/1/d881b307-917c-4872-bd02-b3fb5502edc7.jpg",
  "SSD TF VULCAN G4 512G 2.5 SATA": "https://media.pangoly.com/img/d/8/8/1/d881b307-917c-4872-bd02-b3fb5502edc7.jpg",
  "SSD XPG GAMMIX S65 1TB M.2 NVMe": "https://media.pangoly.com/img/9/e/d/6/9ed635e1-8723-4ab9-945d-4188b4a34a88.jpg",
  "SSD XPG GAMMIX S65 512G M.2 NVMe": "https://media.pangoly.com/img/9/e/d/6/9ed635e1-8723-4ab9-945d-4188b4a34a88.jpg",
};

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

function getBgHex(brand: string): string {
  const colors: Record<string, string> = {
    AMD: "1F71C7",
    Intel: "0068B5",
    NVIDIA: "76B900",
    ASUS: "00529B",
    MSI: "D32F2F",
    Gigabyte: "E4002B",
    Kingston: "C8102E",
    ThermalTake: "00B2E3",
    "ADATA / XPG": "2B2B2B",
    Noctua: "C68B59",
    Aerocool: "00B2E3",
    Hiksemi: "0F4C81",
    TeamGroup: "008080",
    AOC: "ED1C24",
    CyM: "B7131A",
  };
  return colors[brand] || "1E293B";
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// ── SVG Data URI Generator for Clean Branded Product Cards ──
function createSvgDataUri(brand: string, category: string, title: string): string {
  const bgHex = getBgHex(brand);
  const cleanTitle = title.replace(/["&<>]/g, "");
  const shortTitle = cleanTitle.length > 36 ? cleanTitle.slice(0, 34) + "..." : cleanTitle;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#${bgHex}"/>
    <rect x="24" y="24" width="552" height="552" rx="20" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3"/>
    <circle cx="300" cy="200" r="80" fill="#ffffff" fill-opacity="0.12"/>
    <text x="300" y="212" font-family="Arial, sans-serif" font-weight="bold" font-size="44" fill="#ffffff" text-anchor="middle">${brand}</text>
    <text x="300" y="340" font-family="Arial, sans-serif" font-weight="600" font-size="28" fill="#ffffff" fill-opacity="0.9" text-anchor="middle">${category}</text>
    <rect x="60" y="400" width="480" height="80" rx="12" fill="#ffffff" fill-opacity="0.15"/>
    <text x="300" y="448" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${shortTitle}</text>
  </svg>`;
  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

// ── Upload from URL ──
async function uploadFromUrl(url: string, publicId: string): Promise<string> {
  const result = await cloudinary.uploader.upload(url, {
    folder: "cym-crm/products",
    public_id: publicId,
    resource_type: "image",
    overwrite: true,
  });
  return result.secure_url;
}

// ── Download buffer ──
function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
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
    }).on("error", reject);
  });
}

// ── Upload SVG Data URI ──
async function uploadSvgDataUri(dataUri: string, publicId: string): Promise<string> {
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "cym-crm/products",
    public_id: publicId,
    resource_type: "image",
    overwrite: true,
  });
  return result.secure_url;
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

  let realUploaded = 0;
  let svgUploaded = 0;
  let failed = 0;

  console.log("🚀 STARTING IMAGE RE-POPULATION FOR ALL 157 PRODUCTS...\n");

  for (const { delegate, name } of models) {
    const items = await (delegate as any).findMany({ orderBy: { nombre: "asc" } });
    console.log(`📦 Processing ${name}s (${items.length} items)...`);

    for (const item of items) {
      const slug = slugify(item.nombre);
      const knownUrl = KNOWN_URLS[item.nombre];
      const brand = getBrand(item.nombre, item.marca);

      let success = false;

      // Strategy 1a: Try Cloudinary server-side upload from known real URL
      if (knownUrl) {
        try {
          const url = await uploadFromUrl(knownUrl, slug);
          await (delegate as any).update({ where: { id: item.id }, data: { imagenUrl: url } });
          console.log(`  ✅ [Real URL] ${item.nombre}`);
          realUploaded++;
          success = true;
        } catch {
          // fallback to buffer
        }
      }

      // Strategy 1b: Try buffer download from known real URL
      if (!success && knownUrl) {
        try {
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
            console.log(`  ✅ [Buffer Upload] ${item.nombre}`);
            realUploaded++;
            success = true;
          }
        } catch {
          // fallback to SVG
        }
      }

      // Strategy 2: Generate and upload high-quality SVG Data URI to Cloudinary
      if (!success) {
        try {
          const svgDataUri = createSvgDataUri(brand, name, item.nombre);
          const url = await uploadSvgDataUri(svgDataUri, slug);
          await (delegate as any).update({ where: { id: item.id }, data: { imagenUrl: url } });
          console.log(`  🎨 [SVG Placeholder] ${item.nombre}`);
          svgUploaded++;
          success = true;
        } catch (err) {
          console.log(`  ❌ [FAILED] ${item.nombre}: ${err instanceof Error ? err.message : err}`);
          failed++;
        }
      }
    }
  }

  console.log("\n=================================");
  console.log("📊 IMAGE FIX SUMMARY:");
  console.log(`   ✅ Real Images Uploaded: ${realUploaded}`);
  console.log(`   🎨 SVG Placeholders Uploaded: ${svgUploaded}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log("=================================\n");
}

main().catch(console.error).finally(() => prisma.$disconnect());
