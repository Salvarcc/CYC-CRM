import https from "https";
import http from "http";

const PAGES: Record<string, string> = {
  // Gigabyte
  "GB B650 GAMING X AX V2": "https://www.gigabyte.com/Motherboard/B650-GAMING-X-AX-V2-rev-10/rev-1.0",
  "GB B760 DS3H": "https://www.gigabyte.com/Motherboard/B760-DS3H-rev-10/rev-1.0",
  "GB B760M D3HP": "https://www.gigabyte.com/Motherboard/B760M-D3HP-rev-10/rev-1.0",
  "GB B840M DS3H": "https://www.gigabyte.com/Motherboard/B840M-DS3H-rev-10/rev-1.0",
  "GB B860M K": "https://www.gigabyte.com/Motherboard/B860M-K-rev-10/rev-1.0",
  "GB H610M K V2": "https://www.gigabyte.com/Motherboard/H610M-K-V2-rev-10/rev-1.0",
  "GB Z790-D": "https://www.gigabyte.com/Motherboard/Z790-D-rev-10/rev-1.0",
  // MSI
  "MS H610M-S": "https://www.msi.com/Motherboard/H610M-S-DDR4",
  "MS PRO B760M-E": "https://www.msi.com/Motherboard/PRO-B760M-E-DDR5",
  "MS PRO B760M-P": "https://www.msi.com/Motherboard/PRO-B760M-P-DDR4",
  "MS PRO B860M-E": "https://www.msi.com/Motherboard/PRO-B860M-E",
  "MS PRO X870E-P": "https://www.msi.com/Motherboard/PRO-X870E-P-WIFI",
};

function fetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }, timeout: 20000 }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode!) && res.headers.location) {
        res.resume();
        return fetch(new URL(res.headers.location, url).toString()).then(resolve, reject);
      }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    }).on("timeout", function () { this.destroy(); reject(new Error("timeout")); })
      .on("error", reject);
  });
}

async function main() {
  for (const [name, url] of Object.entries(PAGES)) {
    try {
      const html = await fetch(url);
      const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/);
      const m2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/);
      const og = (m && m[1]) || (m2 && m2[1]) || "NOT FOUND";
      console.log(`${name}\n   ${og}\n   (page len ${html.length})`);
    } catch (e: any) {
      console.log(`${name}\n   ERR: ${e.message}`);
    }
  }
}
main();
