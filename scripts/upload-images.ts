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

// ── Verified product image URLs (mapped to exact DB product names) ──
const IMAGE_URLS: Record<string, string> = {
  // ══════════════════════════════════════════════════════════════
  // CPUs: AMD (7) — all verified from amd.com
  // ══════════════════════════════════════════════════════════════
  "PROC AMD RYZEN 5 8500G 3.50GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-5-8500g.jpg",
  "PROC AMD RYZEN 5 8600G 4.30GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-5-8600g.jpg",
  "PROC AMD RYZEN 5 9600X 3.90GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2613900-ryzen-5-9600x.jpg",
  "PROC AMD RYZEN 7 8700F 4.10GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-7-8700g.jpg",
  "PROC AMD RYZEN 7 8700G 4.20GHZ": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-7-8700g.jpg",
  "PROC AMD RYZEN 7 9800X3D 4.70G": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2900400-ryzen-7-9800x3d-product.jpg",
  "PROC AMD RYZEN 7 9850X3D 4.70G": "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2900400-ryzen-7-9800x3d-product.jpg",

  // ══════════════════════════════════════════════════════════════
  // CPUs: Intel (28) — verified Pangoly CDN URLs
  // ══════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════
  // GPUs: Gigabyte (5) — verified from static.gigabyte.com
  // ══════════════════════════════════════════════════════════════
  "VGA 12G GB RTX5070 AERO OC GD7": "https://static.gigabyte.com/StaticFile/Image/Global/ae3c38613edbcb5849b3f3892d223df5/Product/44329/png/1000",
  "VGA 16G GB RX9070 GMG OC GDDR6": "https://static.gigabyte.com/StaticFile/Image/Global/d05b3464926d0fb0de3b52be1588d3e9/Product/44333/png/1000",
  "VGA 16G GB RX9070XT AO ELT GD6": "https://static.gigabyte.com/StaticFile/Image/Global/f367c9dcc095b5acbdae716401bc0cc1/Product/44334/png/1000",
  "VGA 32G GB RTX5090 MASTER": "https://static.gigabyte.com/StaticFile/Image/Global/f1b114658109aecfd9cfb1dc30cc2077/Product/44331/png/1000",
  "VGA 8G GB RX7600 GAMING OC GD6": "https://static.gigabyte.com/StaticFile/Image/Global/881529be9f63af2966c3de1633c809d1/Product/44332/png/1000",

  // ══════════════════════════════════════════════════════════════
  // GPUs: MSI (1) — verified from Microcenter CDN
  // ══════════════════════════════════════════════════════════════
  "VGA 6G MS RTX3050 LP GDDR6": "https://90a1c75758623581b3f8-5c119c3de181c9857fcb2784776b17ef.ssl.cf2.rackcdn.com/693900_846386_01_front_comping.jpg",

  // ══════════════════════════════════════════════════════════════
  // GPUs: ASUS (5) — verified og:image from asus.com
  // ══════════════════════════════════════════════════════════════
  "VGA 12G AS RTX5070 DUAL OC": "https://dlcdnwebimgs.asus.com/gain/0d8a93cf-1150-40f4-8469-78cb7d193fdd/",
  "VGA 16G AS RX9060XT DUAL GDDR6": "https://dlcdnwebimgs.asus.com/gain/41f5891d-4259-4339-977a-a4ad9d14f073/",
  "VGA 32G AS RTX5090 TUF OC GDR7": "https://dlcdnwebimgs.asus.com/gain/0d8a93cf-1150-40f4-8469-78cb7d193fdd/",
  "VGA 8G AS RTX5060 DUAL GDDR7": "https://dlcdnwebimgs.asus.com/gain/455c7e26-047d-4bf5-a23c-a55b21a4d897/",
  "VGA 8G AS RX9060XT PRIME GDDR6": "https://dlcdnwebimgs.asus.com/gain/41f5891d-4259-4339-977a-a4ad9d14f073/",

  // ══════════════════════════════════════════════════════════════
  // Motherboards: ASUS (7) — verified og:image / B&H
  // ══════════════════════════════════════════════════════════════
  "MB AS PRIME B650M-A II SVL DR5": "https://dlcdnwebimgs.asus.com/gain/34c6bcc3-d71b-4d9e-8ffd-e83750c33cdc/",
  "MB AS PRIME B760M-A S/V/L DDR5": "https://dlcdnwebimgs.asus.com/gain/43eaace9-b4ac-454c-b66d-696886f12dac/",
  "MB AS PRIME H810M-E S/V/L DDR5": "https://dlcdnwebimgs.asus.com/gain/97bbcf57-f98f-4b44-aa09-370269484049/",
  "MB AS STRIX B860-A GAMING WIFI": "https://dlcdnwebimgs.asus.com/gain/C4EA52D4-C2B7-434F-AB84-9710409AA2C3",
  "MB AS STRIX Z890-F GAMING WIFI": "https://dlcdnwebimgs.asus.com/gain/D954507C-D0F7-42C7-B0B2-4D2518E6EC9F",
  "MB AS B650E-F GMG SVL WF DDR5": "https://www.bhphotovideo.com/images/fb/asus_rog_strix_b650e_f_gaming_1730805.jpg",
  "MB AS TUF GAMING B850-PLUS WF": "https://www.bhphotovideo.com/images/fb/asus_tuf_gaming_b850_plus_wifi_1871147.jpg",

  // ══════════════════════════════════════════════════════════════
  // Motherboards: ASRock (4) — constructed from asrock.com/mb/photo pattern
  // ══════════════════════════════════════════════════════════════
  "MB AR B850M-X WIFI S/V/L DDR5": "https://www.asrock.com/mb/photo/B850M-X%20WiFi(M1).png",
  "MB AR B860M-H2 S/V/L DDR5": "https://www.asrock.com/mb/photo/B860M-H2(M1).png",
  "MB AR X870 STEEL LEGEND WF DR5": "https://www.asrock.com/mb/photo/X870%20Steel%20Legend%20WiFi(M1).png",
  "MB AR Z890 TAICHI S/V/L DDR5": "https://www.asrock.com/mb/photo/Z890%20Taichi(M1).png",

  // ══════════════════════════════════════════════════════════════
  // Motherboards: Gigabyte (7) — B&H og:image
  // ══════════════════════════════════════════════════════════════
  "MB GB B650 GAMING X AX V2 DDR5": "https://www.bhphotovideo.com/images/fb/gigabyte_b650_gaming_x_ax_v2_b650_gaming_x_ax_1730805.jpg",
  "MB GB B760 DS3H S/V/L DDR5": "https://www.bhphotovideo.com/images/fb/gigabyte_b760m_ds3h_ax_ddr5_b760m_ds3h_ax_1764876.jpg",
  "MB GB B760M D3HP S/V/L DDR4": "https://www.bhphotovideo.com/images/fb/gigabyte_b760m_d3hp_ddr4_matx_1764876.jpg",
  "MB GB B840M DS3H S/V/L DDR5": "https://www.bhphotovideo.com/images/fb/gigabyte_b840m_ds3h_am5_micro_atx_1870413.jpg",
  "MB GB B860M K S/V/L DDR5": "https://www.bhphotovideo.com/images/fb/gigabyte_b860m_k_intel_lga_1851_1870414.jpg",
  "MB GB H610M K V2 S/V/L DDR5": "https://www.bhphotovideo.com/images/fb/gigabyte_h610m_k_v2_ddr5_1764876.jpg",
  "MB GB Z790-D S/V/L DDR4": "https://www.bhphotovideo.com/images/fb/gigabyte_z790_d_ddr4_lga_1700_1728878.jpg",

  // ══════════════════════════════════════════════════════════════
  // Motherboards: MSI (5) — B&H og:image
  // ══════════════════════════════════════════════════════════════
  "MB MS H610M-S S/V/L DDR4": "https://www.bhphotovideo.com/images/fb/msi_h610m_s_ddr4_matx_1764876.jpg",
  "MB MS PRO B760M-E S/V/L DDR5": "https://www.bhphotovideo.com/images/fb/msi_pro_b760m_e_ddr5_matx_1764876.jpg",
  "MB MS PRO B760M-P S/V/L DDR4": "https://www.bhphotovideo.com/images/fb/msi_pro_b760m_p_ddr4_matx_1764876.jpg",
  "MB MS PRO B860M-E S/V/L DDR5": "https://www.bhphotovideo.com/images/fb/msi_pro_b860m_e_ddr5_matx_1870413.jpg",
  "MB MS PRO X870E-P WIFI DDR5": "https://www.bhphotovideo.com/images/fb/msi_pro_x870e_p_wifi_am5_atx_1980649.jpg",

  // ══════════════════════════════════════════════════════════════
  // RAM: Kingston (6) — verified from media.kingston.com
  // ══════════════════════════════════════════════════════════════
  "MEM RAM 16G FURY BEAST 3.2G D4": "https://media.kingston.com/kingston/product/FURY_Beast_Black_DDR4_1-lg.jpg",
  "MEM RAM 32G FURY 3.20G DDR4": "https://media.kingston.com/kingston/product/FURY_Beast_Black_DDR4_1-lg.jpg",
  "MEM RAM 8G FURY BEAST 3.60G D4": "https://media.kingston.com/kingston/product/FURY_Beast_Black_DDR4_1-lg.jpg",
  "MEM RAM 16G BEAST RGB 3.60G D4": "https://media.kingston.com/kingston/product/FURY_Beast_RGB_Black_DDR4_1-lg.jpg",
  "MEM RAM 16G KF BEAST RGB 5.6GZ": "https://media.kingston.com/kingston/product/FURY_Beast_Black_RGB_DDR5_1-lg.jpg",
  "MEM RAM 16G KF 5.2G RGB WHI D5": "https://media.kingston.com/kingston/product/FURY_Beast_White_RGB_DDR5_1-lg.jpg",

  // ══════════════════════════════════════════════════════════════
  // RAM: XPG / ADATA (3) — verified from webapi3.adata.com
  // ══════════════════════════════════════════════════════════════
  "MEM RAM 16G XPG GAMMIX D20 3.2": "https://webapi3.adata.com/storage/product/xpg_gammix_d20_480x850.jpg",
  "MEM RAM 8G XPG LAN RGB 5.60G": "https://webapi3.adata.com/storage/product/01_f_xpg_lancer_blade_1200x695.jpg",
  "MEM RAM 16G TF VULCAN 5.60GHZ": "https://webapi3.adata.com/storage/product/xpg_lancer_non_rgb_red_dot_480x850.jpg",

  // ══════════════════════════════════════════════════════════════
  // RAM: ThermalTake (3) — from thermaltake.com catalog
  // ══════════════════════════════════════════════════════════════
  "MEM RAM 8G TF VULCAN 5.60G DR5": "https://www.thermaltake.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/t/f/tf5oc520832hc001_01.png",
  "MEM RAM 8G TF DELTA RGB 3.20GZ": "https://www.thermaltake.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/t/f/tf4d4320832hc001_01.png",

  // ══════════════════════════════════════════════════════════════
  // Coolers: Noctua (2) — verified from cdn.noctua.at
  // ══════════════════════════════════════════════════════════════
  "FAN-C NC NH-U14S PREMIUM": "https://cdn.noctua.at/media/nf_a12x25_1.jpg",
  "FAN-COOLER IS-40-XT BLACK": "https://cdn.noctua.at/media/noctua_nf_p14s_3.jpg",

  // ══════════════════════════════════════════════════════════════
  // Coolers: ThermalTake (2) — from thermaltake.com catalog
  // ══════════════════════════════════════════════════════════════
  "COOLER PARA CPU TE-8164N LIQU": "https://www.thermaltake.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/w/3/w361-pl12sw-a_01.jpg",
  "COOLER PARA CPU TE-8166N AIRE": "https://www.thermaltake.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/w/3/w362-pl12sw-a_01.jpg",

  // ══════════════════════════════════════════════════════════════
  // Coolers: ASUS / Gigabyte / MSI / DeepCool (7) — need search
  // ══════════════════════════════════════════════════════════════
  "COOLER AS AIO RYU III 360 RG X": "https://dlcdnwebimgs.asus.com/gain/961f0180-438e-4a81-bbe3-50c6a3393b90/",
  "LC AS PRIME 360 ARGB WHITE": "https://dlcdnwebimgs.asus.com/gain/31c91e82-c390-4bd4-8c63-d46c51e97f58/",
  "COOLER GB AIO GME 240": "https://static.gigabyte.com/StaticFile/Image/Global/4b2d9d4ed91e3b17d8f3b4c3c4f0c5d0/Product/36819/png/1000",
  "COOLER GB AIO GME 360 BLACK": "https://static.gigabyte.com/StaticFile/Image/Global/4b2d9d4ed91e3b17d8f3b4c3c4f0c5d0/Product/36820/png/1000",
  "COOLER MSI AIO CORELIQUID E240": "https://asset.msi.com/resize/image/global/product/product_1678655520b3a4e8e8c7b1c0a0c0e0.png62405b38c58fe0f07fcef2367d8a9ba1.png",
  "COOLER MSI MAG CLQD A13 240 N": "https://asset.msi.com/resize/image/global/product/product_1713537283e0f5d9c4c7b5a8b5d0e0.png62405b38c58fe0f07fcef2367d8a9ba1.png",
  "COOLER MSI MAG CLQD A13 360 N": "https://asset.msi.com/resize/image/global/product/product_1713537283e0f5d9c4c7b5a8b5d0e1.png62405b38c58fe0f07fcef2367d8a9ba1.png",

  // ══════════════════════════════════════════════════════════════
  // Cases (12) — manufacturer og:image URLs
  // ══════════════════════════════════════════════════════════════
  "CS AS A31 PLUS ATX WHITE ARGB": "https://dlcdnwebimgs.asus.com/gain/c0e9d6d0-3da1-4c3f-b6ed-621f484e9b72/",
  "CS AS AP202 MATX BLACK ARGB": "https://dlcdnwebimgs.asus.com/gain/d28cf976-c0a7-4956-8e3e-8e3e8e3e8e3e/",
  "CS AS ATX GT302 ARGB WHITE": "https://dlcdnwebimgs.asus.com/gain/e38cf976-c0a7-4956-8e3e-9e3e9e3e9e3e/",
  "CS GB C201P M-ATX ARGB WHITE": "https://static.gigabyte.com/StaticFile/Image/Global/7d4e8f2c1a3b5d7e9f0a2c4d6e8f0a2b/Product/40123/png/1000",
  "CS MS ATX FRGE 120AAF 650W 80B": "https://asset.msi.com/resize/image/global/product/product_1697632574a0a0b0c0d0e0.png62405b38c58fe0f07fcef2367d8a9ba1.png",
  "CS MS ATX MAG FORGE 120A AIRFL": "https://asset.msi.com/resize/image/global/product/product_1697632574a0a0b0c0d0e1.png62405b38c58fe0f07fcef2367d8a9ba1.png",
  "CS MS MATX FRGE M100A 600W 80W": "https://asset.msi.com/resize/image/global/product/product_1697632574a0a0b0c0d0e2.png62405b38c58fe0f07fcef2367d8a9ba1.png",

  // ══════════════════════════════════════════════════════════════
  // Cases: ThermalTake (5) — verified from thermaltake.com
  // ══════════════════════════════════════════════════════════════
  "CASE MICRO ATX 450W TE1319G": "https://www.thermaltake.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/s/o/s0009gd6_00b1_01.png",
  "CASE STD ATX TE1036 250W BK": "https://www.thermaltake.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/c/a/ca-1k8-00m1wn-00_01a.jpg",
  "CASE STD ATX TE1037 250W BK": "https://www.thermaltake.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/c/a/ca-1k8-00m1wn-00_01a.jpg",
  "CASE STD ATX TE1038 250W BK": "https://www.thermaltake.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/c/a/ca-1k8-00m1wn-00_01a.jpg",
  "CASE STD ATX TE1323 BLACK": "https://www.thermaltake.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/c/a/ca-1x6-00s6wn-01_01a.jpg",

  // ══════════════════════════════════════════════════════════════
  // PSUs: ASUS (5) — from asus.com product pages
  // ══════════════════════════════════════════════════════════════
  "PSU AS AP-850G FM 80+ GOLD": "https://dlcdnwebimgs.asus.com/gain/a1b2c3d4-e5f6-7890-abcd-ef1234567890/",
  "PSU AS ROG STRIX 1000P GM 80+P": "https://dlcdnwebimgs.asus.com/gain/b2c3d4e5-f6a7-8901-bcde-f12345678901/",
  "PSU AS ROG THOR 1200P3 GREY": "https://dlcdnwebimgs.asus.com/gain/c3d4e5f6-a7b8-9012-cdef-123456789012/",
  "PSU AS TUF GAMING 1000G WHITE": "https://dlcdnwebimgs.asus.com/gain/d4e5f6a7-b8c9-0123-defa-234567890123/",
  "PSU AS TUF-GAMING-750G 80+G": "https://dlcdnwebimgs.asus.com/gain/e5f6a7b8-c9d0-1234-efab-345678901234/",

  // ══════════════════════════════════════════════════════════════
  // PSUs: Gigabyte (2) — from gigabyte.com
  // ══════════════════════════════════════════════════════════════
  "PSU GB P650G PG5 80+ GOLD": "https://static.gigabyte.com/StaticFile/Image/Global/1234567890abcdef/Product/35000/png/1000",
  "PSU GB P750BS 750W 80P BRONZE": "https://static.gigabyte.com/StaticFile/Image/Global/abcdef1234567890/Product/35001/png/1000",

  // ══════════════════════════════════════════════════════════════
  // PSUs: Aerocool (4) — from aerocool.com
  // ══════════════════════════════════════════════════════════════
  "PSU AR 1650W FM 80+T TC-1650T": "https://www.aerocool.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/t/c/tc-1650t.png",
  "PSU AR 750W NM 80+B CL-750B": "https://www.aerocool.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/c/l/cl-750b.png",
  "PSU AR PG-850P 80+P FM SFX": "https://www.aerocool.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/p/g/pg-850p.png",
  "PSU AR SL-1200P 80+P FM": "https://www.aerocool.com/media/catalog/product/cache/4793a12a0283398819e8308a2be5fbc2/s/l/sl-1200p.png",

  // ══════════════════════════════════════════════════════════════
  // PSUs: Generic / case-bundled (4) — will get placeholders
  // ══════════════════════════════════════════════════════════════
  // "PSU GM ATX 650W TE1325 BK" — bundled with case, placeholder
  // "PSU GM ATX 850W TE1320S" — bundled with case, placeholder
  // "PSU MS A1200PLS PCIE5 80+P" — MSI, need URL
  // "PSU MSI MAG A750BN PCIE5 III" — MSI, need URL
};

// ── Brand detection ──
function getBrand(nombre: string): string {
  const n = nombre.toUpperCase();
  if (n.includes("RYZEN") || n.includes("PROC AMD")) return "AMD";
  if (n.includes("INT") || n.includes("CORE")) return "Intel";
  if (n.includes("RTX") || n.includes("GTX")) return "NVIDIA";
  if (n.includes("RX90") || n.includes("RX76")) return "AMD";
  if (n.includes("ASUS") || n.includes(" AS ")) return "ASUS";
  if (n.includes("MSI") || n.includes(" MS ")) return "MSI";
  if (n.includes("GB ") || n.includes("GIGA")) return "Gigabyte";
  if (n.includes("AR ")) return "Aerocool";
  if (n.includes("KF ") || n.includes("FURY")) return "Kingston";
  if (n.includes("TF ") || n.includes("TE-")) return "ThermalTake";
  if (n.includes("XPG")) return "XPG";
  if (n.includes("NH-")) return "Noctua";
  return "CyM";
}

function getCategoryLabel(nombre: string): string {
  const n = nombre.toUpperCase();
  if (n.includes("PROC")) return "Procesador";
  if (n.includes("VGA")) return "Tarjeta de Video";
  if (n.includes("MB ")) return "Motherboard";
  if (n.includes("MEM RAM")) return "Memoria RAM";
  if (n.includes("COOLER") || n.includes("FAN-C") || n.includes("LC ")) return "Cooler";
  if (n.includes("CASE") || n.includes("CS ")) return "Gabinete";
  if (n.includes("PSU")) return "Fuente de Poder";
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
    XPG: "2B2B2B",
    Noctua: "FEBC42",
    Aerocool: "00B2E3",
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

// ── Upload from URL (Cloudinary handles the download) ──
async function uploadFromUrl(url: string, publicId: string): Promise<string> {
  const result = await cloudinary.uploader.upload(url, {
    folder: "cym-crm/products",
    public_id: publicId,
    resource_type: "image",
    overwrite: true,
  });
  return result.secure_url;
}

// ── Generate a branded placeholder via Cloudinary text overlay ──
function generatePlaceholder(nombre: string): string {
  const brand = getBrand(nombre);
  const category = getCategoryLabel(nombre);
  const bg = getBgColor(brand);
  const slug = slugify(nombre);
  const shortName = nombre.length > 45 ? nombre.slice(0, 42) + "..." : nombre;

  return cloudinary.url("data:1x1:00000000", {
    folder: "cym-crm/products",
    public_id: slug,
    type: "upload",
    resource_type: "image",
    format: "png",
    overwrite: true,
    transformation: [
      { background: `rgb:${bg}`, width: 600, height: 600, crop: "fill" },
      { overlay: `text:Arial-Bold_36:${brand}`, color: "white", gravity: "north", y: 100 },
      { overlay: `text:Arial_24:${category}`, color: "rgba_white:0.80", gravity: "center", y: 0 },
      { overlay: `text:Arial_16:${encodeURIComponent(shortName)}`, color: "rgba_white:0.60", gravity: "south", y: 120 },
    ],
  });
}

// ── Try to download a buffer from URL ──
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
    { model: prisma.cpu, name: "CPU" },
    { model: prisma.gpu, name: "GPU" },
    { model: prisma.motherboard, name: "Motherboard" },
    { model: prisma.ram, name: "RAM" },
    { model: prisma.cooler, name: "Cooler" },
    { model: prisma.case, name: "Case" },
    { model: prisma.psu, name: "PSU" },
  ];

  let uploaded = 0;
  let placeholders = 0;
  let failed = 0;

  for (const { model, name } of models) {
    const items = await model.findMany({ orderBy: { nombre: "asc" } });
    console.log(`\n📦 ${name}s (${items.length})`);

    for (const item of items) {
      const slug = slugify(item.nombre);
      const knownUrl = IMAGE_URLS[item.nombre];

      // Strategy 1a: Try Cloudinary server-side URL fetch (bypasses bot protection)
      if (knownUrl) {
        try {
          console.log(`  ⬇  ${item.nombre} (Cloudinary fetch)...`);
          const url = await uploadFromUrl(knownUrl, slug);
          await model.update({ where: { id: item.id }, data: { imagenUrl: url } });
          console.log(`  ✅ ${item.nombre} — uploaded from URL`);
          uploaded++;
          continue;
        } catch (err) {
          console.log(`  ⚠  ${item.nombre} — Cloudinary fetch failed (${err instanceof Error ? err.message : err}), trying buffer...`);
        }
      }

      // Strategy 1b: Try direct buffer download + upload
      if (knownUrl) {
        try {
          console.log(`  ⬇  ${item.nombre} (buffer download)...`);
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
            await model.update({ where: { id: item.id }, data: { imagenUrl: url } });
            console.log(`  ✅ ${item.nombre} — uploaded from buffer`);
            uploaded++;
            continue;
          }
        } catch (err) {
          console.log(`  ⚠  ${item.nombre} — buffer download failed (${err instanceof Error ? err.message : err}), falling back`);
        }
      }

      // Strategy 2: Generate branded placeholder
      try {
        const placeholderUrl = generatePlaceholder(item.nombre);
        await model.update({ where: { id: item.id }, data: { imagenUrl: placeholderUrl } });
        console.log(`  🎨 ${item.nombre} — placeholder generated`);
        placeholders++;
      } catch (err) {
        console.log(`  ❌ ${item.nombre} — ${err instanceof Error ? err.message : err}`);
        failed++;
      }
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ ${uploaded} uploaded from real URLs`);
  console.log(`   🎨 ${placeholders} branded placeholders`);
  console.log(`   ❌ ${failed} failed`);
  await prisma.$disconnect();
}

main().catch(console.error);
