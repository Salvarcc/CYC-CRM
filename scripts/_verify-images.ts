import https from "https";
import http from "http";

const ENTRIES: Record<string, string> = {
  "B650E-F (gain)": "https://dlcdnwebimgs.asus.com/gain/19822d33-e84b-44d7-b90e-e9b422287083/",
  "TUF B850-PLUS (gain)": "https://dlcdnwebimgs.asus.com/gain/4fa02c46-d242-4d73-a8e6-aebb298a1b09/",
  "GT302 ARGB (gain)": "https://dlcdnwebimgs.asus.com/gain/26a5c1b0-b8a9-49ed-8721-2609fcc6bb60/",
  "AP201 (gain)": "https://dlcdnwebimgs.asus.com/gain/e393bf2c-2034-4d10-891f-3d476d6c5e98/",
  "A21 PLUS (gain)": "https://dlcdnwebimgs.asus.com/gain/2ae4b854-bc21-49ac-b2a1-5722759e900d/",
};

function check(url: string): Promise<string> {
  return new Promise((resolve) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 }, (res) => {
      const ct = res.headers["content-type"] || "";
      const len = res.headers["content-length"];
      res.resume();
      resolve(`${res.statusCode}\t${ct}\t${len ?? "?"}`);
    });
    req.on("timeout", () => { req.destroy(); resolve("TIMEOUT\t-\t-"); });
    req.on("error", (e: any) => resolve(`ERR:${e.code || e.message}\t-\t-`));
  });
}

async function main() {
  for (const [k, url] of Object.entries(ENTRIES)) {
    const r = await check(url);
    console.log(`${k}\n   ${r}\t${url}`);
  }
}
main();
