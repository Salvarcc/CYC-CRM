import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function createSvgDataUri(brand: string, category: string, title: string, bgHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#${bgHex}"/>
    <rect x="20" y="20" width="560" height="560" rx="16" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="2"/>
    <text x="300" y="140" font-family="Arial, sans-serif" font-weight="bold" font-size="38" fill="#ffffff" text-anchor="middle">${brand}</text>
    <text x="300" y="300" font-family="Arial, sans-serif" font-size="26" fill="#ffffff" fill-opacity="0.85" text-anchor="middle">${category}</text>
    <text x="300" y="460" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" fill-opacity="0.7" text-anchor="middle">${title.length > 40 ? title.slice(0, 38) + "..." : title}</text>
  </svg>`;
  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

async function main() {
  const dataUri = createSvgDataUri("ASUS", "Tarjeta de Video", "VGA 16G AS RX9060XT DUAL GDDR6", "00529B");
  const res = await cloudinary.uploader.upload(dataUri, {
    folder: "cym-crm/products",
    public_id: "test-svg-placeholder",
    resource_type: "image",
    overwrite: true,
  });
  console.log("Uploaded SVG URL:", res.secure_url);
}

main().catch(console.error);
