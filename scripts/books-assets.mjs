// One-shot export for /products/: front covers cropped from the KDP wraps.
// Run from the repo root:  node scripts/books-assets.mjs
// Sources live in the sibling colouring-books repo; outputs are committed.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = process.env.BOOKS_SRC ?? path.resolve('../../Digital-products/colouring-books');
const OUT = 'public/assets/img/books';
fs.mkdirSync(OUT, { recursive: true });

// slug -> wrap file inside <SRC>/<dir>/cover/
const BOOKS = {
  nurses: 'nurses/cover/nurse-shit-cover.png',
  teachers: 'teachers/cover/teacher-shit-cover.png',
  'high-school': 'high-school/cover/high-school-shit-cover.png',
};

// Front panel + outer bleed, as a fraction of the wrap's height (8.625in / 11.25in).
const FRONT_W_PER_H = 8.625 / 11.25;

for (const [slug, rel] of Object.entries(BOOKS)) {
  const file = path.join(SRC, rel);
  const { width, height } = await sharp(file).metadata();
  const frontW = Math.round(height * FRONT_W_PER_H);
  await sharp(file)
    .extract({ left: width - frontW, top: 0, width: frontW, height })
    .resize({ width: 600 })
    .webp({ quality: 82 })
    .toFile(path.join(OUT, `${slug}.webp`));
  console.log(`${slug}: ${width}x${height} -> front ${frontW}px -> ${OUT}/${slug}.webp`);
}
