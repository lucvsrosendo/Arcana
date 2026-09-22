import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteUrl = (process.env.VITE_SITE_URL ?? "https://tarot.example.com").replace(/\/$/, "");

const staticPaths = [
  "/",
  "/home",
  "/reading",
  "/history",
  "/journal",
  "/arcana",
  "/learn",
  "/settings",
  "/privacy",
  "/terms",
  "/cookies",
];

const urls = staticPaths
  .map(
    (path) => `  <url>
    <loc>${siteUrl}${path === "/" ? "" : path}</loc>
    <changefreq>weekly</changefreq>
  </url>`,
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(resolve(__dirname, "../public/sitemap.xml"), xml, "utf8");
console.log(`Wrote sitemap.xml with ${staticPaths.length} URLs for ${siteUrl}`);
