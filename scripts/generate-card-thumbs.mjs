import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = path.resolve("public/tarot/cards");
const targetDir = path.resolve("public/tarot/thumbs");
const THUMB_WIDTH = 300;

await mkdir(targetDir, { recursive: true });

const files = (await readdir(sourceDir)).filter((file) => file.endsWith(".webp"));

await Promise.all(
  files.map((file) =>
    sharp(path.join(sourceDir, file))
      .resize({ width: THUMB_WIDTH })
      .webp({ quality: 74, effort: 6 })
      .toFile(path.join(targetDir, file)),
  ),
);

console.log(`${files.length} miniaturas geradas em ${path.relative(process.cwd(), targetDir)}`);
