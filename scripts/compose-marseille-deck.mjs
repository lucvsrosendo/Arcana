import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_DIR = path.resolve(
  process.env.LOCALAPPDATA ?? "",
  "Temp",
);
const ASSETS_DIR = path.resolve(
  "C:/Users/W-10/.cursor/projects/c-Tech-tarot/assets",
);
const OUT_DIR = path.join(ROOT, "public", "tarot", "cards");

const WIDTH = 540;
const HEIGHT = 810;
const MARGIN = 32;
const INNER = 8;
const TOP_BAND = 66;
const BOTTOM_BAND = 28;

const CARDS = [
  { id: "the-fool", roman: "0" },
  { id: "the-magician", roman: "I" },
  { id: "the-high-priestess", roman: "II" },
  { id: "the-empress", roman: "III" },
  { id: "the-emperor", roman: "IIII" },
  { id: "the-hierophant", roman: "V" },
  { id: "the-lovers", roman: "VI" },
  { id: "the-chariot", roman: "VII" },
  { id: "justice", roman: "VIII" },
  { id: "the-hermit", roman: "VIIII" },
  { id: "wheel-of-fortune", roman: "X" },
  { id: "strength", roman: "XI" },
  { id: "the-hanged-man", roman: "XII" },
  { id: "death", roman: "XIII" },
  { id: "temperance", roman: "XIIII" },
  { id: "the-devil", roman: "XV" },
  { id: "the-tower", roman: "XVI" },
  { id: "the-star", roman: "XVII" },
  { id: "the-moon", roman: "XVIII" },
  { id: "the-sun", roman: "XVIIII" },
  { id: "judgement", roman: "XX" },
  { id: "the-world", roman: "XXI" },
];

const escapeXml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const frameSvg = (roman) => {
  const safe = escapeXml(roman);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <pattern id="grain" width="120" height="120" patternUnits="userSpaceOnUse">
      <circle cx="18" cy="22" r="1.2" fill="#2a211b" opacity=".05"/>
      <circle cx="66" cy="54" r="1" fill="#2a211b" opacity=".04"/>
      <circle cx="96" cy="88" r="1.4" fill="#2a211b" opacity=".035"/>
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#f4ead2"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grain)"/>
  <rect x="18" y="18" width="${WIDTH - 36}" height="${HEIGHT - 36}" fill="none" stroke="#1c1612" stroke-width="8"/>
  <rect x="30" y="30" width="${WIDTH - 60}" height="${HEIGHT - 60}" fill="none" stroke="#1c1612" stroke-width="2.5"/>
  <rect x="${MARGIN}" y="${MARGIN}" width="${WIDTH - MARGIN * 2}" height="${TOP_BAND}" fill="#f7efdc"/>
  <line x1="${MARGIN + 8}" y1="${MARGIN + TOP_BAND}" x2="${WIDTH - MARGIN - 8}" y2="${MARGIN + TOP_BAND}" stroke="#1c1612" stroke-width="2"/>
  <text x="270" y="${MARGIN + 48}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="40" font-weight="700" fill="#1c1612" letter-spacing="3">${safe}</text>
  <rect x="${MARGIN}" y="${HEIGHT - MARGIN - BOTTOM_BAND}" width="${WIDTH - MARGIN * 2}" height="${BOTTOM_BAND}" fill="#f7efdc"/>
  <line x1="${MARGIN + 8}" y1="${HEIGHT - MARGIN - BOTTOM_BAND}" x2="${WIDTH - MARGIN - 8}" y2="${HEIGHT - MARGIN - BOTTOM_BAND}" stroke="#1c1612" stroke-width="2"/>
</svg>`);
};

async function composeCard(card) {
  const sourcePath = path.join(ASSETS_DIR, `${card.id}.png`);
  const outPath = path.join(OUT_DIR, `${card.id}.webp`);

  const artWidth = WIDTH - (MARGIN + INNER) * 2;
  const artHeight = HEIGHT - MARGIN * 2 - TOP_BAND - BOTTOM_BAND - INNER * 2;
  const artLeft = MARGIN + INNER;
  const artTop = MARGIN + TOP_BAND + INNER;

  const art = await sharp(sourcePath)
    .resize(artWidth, artHeight, { fit: "cover", position: "centre" })
    .sharpen()
    .toBuffer();

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: { r: 244, g: 234, b: 210 },
    },
  })
    .composite([
      { input: frameSvg(card.roman), top: 0, left: 0 },
      { input: art, top: artTop, left: artLeft },
      {
        input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${artWidth}" height="${artHeight}">
          <rect x="1" y="1" width="${artWidth - 2}" height="${artHeight - 2}" fill="none" stroke="#1c1612" stroke-width="3"/>
        </svg>`),
        top: artTop,
        left: artLeft,
      },
    ])
    .webp({ quality: 72, effort: 6 })
    .toFile(outPath);

  return outPath;
}

await mkdir(OUT_DIR, { recursive: true });

const available = new Set((await readdir(ASSETS_DIR)).filter((f) => f.endsWith(".png")));
const missing = CARDS.filter((card) => !available.has(`${card.id}.png`));
if (missing.length) {
  console.error("Missing source art:", missing.map((c) => c.id).join(", "));
  process.exit(1);
}

for (const card of CARDS) {
  const out = await composeCard(card);
  console.log("composed", path.basename(out));
}

console.log(`Done: ${CARDS.length} cards -> ${OUT_DIR}`);
