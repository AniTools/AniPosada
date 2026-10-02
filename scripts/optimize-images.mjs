/* Converts photos in public/images to WebP (max 2000px on the long side) and
   updates every content file that points at them. Safe to run any time — it
   only touches .jpg/.jpeg/.png files, so already-optimized photos are skipped.
   Runs automatically from publish.sh. */
import { readdir, readFile, writeFile, unlink, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const IMAGES = 'public/images';
const CONTENT = 'src/content';
const MAX = 2000;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const renames = new Map();
for (const file of await walk(IMAGES)) {
  if (!/\.(jpe?g|png)$/i.test(file)) continue;
  const target = file.slice(0, -extname(file).length) + '.webp';
  const before = (await stat(file)).size;
  await sharp(file)
    .rotate() // respect camera orientation
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(target);
  const after = (await stat(target)).size;
  await unlink(file);
  renames.set('/' + file.replace(/^public\//, ''), '/' + target.replace(/^public\//, ''));
  console.log(`  ${file} → .webp  ${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB`);
}

if (renames.size) {
  for (const file of await walk(CONTENT)) {
    if (!/\.(json|mdoc|md|ya?ml)$/.test(file)) continue;
    let text = await readFile(file, 'utf8');
    let changed = false;
    for (const [from, to] of renames) {
      if (text.includes(from)) {
        text = text.split(from).join(to);
        changed = true;
      }
    }
    if (changed) await writeFile(file, text);
  }
  console.log(`Optimized ${renames.size} image(s).`);
}
