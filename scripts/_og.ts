import https from "https";

const PAGES: Record<string, string> = {
  "ROG STRIX B650E-F GAMING WIFI": "https://www.asus.com/motherboards-components/motherboards/rog-strix/rog-strix-b650e-f-gaming-wifi/",
  "TUF GAMING B850-PLUS WIFI": "https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b850-plus-wifi/",
  "TUF GAMING GT302 ARGB": "https://www.asus.com/motherboards-components/cases/tuf-gaming/tuf-gaming-gt302-argb/",
  "ASUS Prime AP201": "https://www.asus.com/motherboards-components/cases/prime/asus-prime-ap201-microatx-case",
  "ASUS A21 PLUS": "https://www.asus.com/motherboards-components/cases/asus/asus-a21-plus-case/",
};

function fetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }, timeout: 20000 }, (res) => {
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
      const gains = [...html.matchAll(/https:\/\/dlcdnwebimgs\.asus\.com\/gain\/([a-f0-9-]+)\//gi)]
        .map((m) => m[1]);
      const unique = [...new Set(gains)];
      console.log(`\n### ${name}`);
      console.log(`  STATUS: ${html.startsWith("<") ? "html" : html.length} chars`);
      console.log(`  FIRST 3 GAINS:`);
      unique.slice(0, 3).forEach((g) => console.log(`    https://dlcdnwebimgs.asus.com/gain/${g}/`));
      console.log(`  OG: ${(html.match(/property=["']og:image["']\s+content=["']([^"']+)/) || [])[1] || "none"}`);
    } catch (e: any) {
      console.log(`\n### ${name}\nERR: ${e.message}`);
    }
  }
}
main();
