/* Bulk-adds photos to the gallery.
   Drop photos into photo-inbox/ — loose files go to the gallery without an
   album; files inside a sub-folder go to the album named after that folder
   (e.g. photo-inbox/River Session/*.jpg → album "River Session", created if
   it doesn't exist). Each photo is converted to WebP, gets a gallery entry,
   and is removed from the inbox. Runs automatically from publish.sh. */
import { readdir, readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

const INBOX = 'photo-inbox';
const PHOTOS = 'src/content/photos';
const ALBUMS = 'src/content/albums';
const OUT = 'public/images/gallery';
const IMAGE = /\.(jpe?g|png|webp|heic|heif|tiff?)$/i;

const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'photo';
const titleCase = (s) => s.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^\w/, (c) => c.toUpperCase());
const unique = (dir, slug, ext) => {
  let name = slug, n = 2;
  while (existsSync(join(dir, name + ext))) name = `${slug}-${n++}`;
  return name;
};

if (!existsSync(INBOX)) process.exit(0);
await mkdir(OUT, { recursive: true });

const entries = await readdir(INBOX, { withFileTypes: true });
const jobs = [];
for (const e of entries) {
  if (e.isFile() && IMAGE.test(e.name)) jobs.push({ file: join(INBOX, e.name), album: null });
  if (e.isDirectory()) {
    for (const f of await readdir(join(INBOX, e.name))) {
      if (IMAGE.test(f)) jobs.push({ file: join(INBOX, e.name, f), album: e.name, dir: join(INBOX, e.name) });
    }
  }
}
if (!jobs.length) process.exit(0);

// Albums: reuse by slug, or create one named after the folder.
const albumNames = {};
for (const albumFolder of new Set(jobs.map((j) => j.album).filter(Boolean))) {
  const slug = slugify(albumFolder);
  const path = join(ALBUMS, `${slug}.json`);
  if (existsSync(path)) {
    albumNames[albumFolder] = { slug, name: JSON.parse(await readFile(path, 'utf8')).name };
  } else {
    const orders = await Promise.all(
      (await readdir(ALBUMS)).filter((f) => f.endsWith('.json')).map(async (f) => JSON.parse(await readFile(join(ALBUMS, f), 'utf8')).order ?? 100)
    );
    const name = { en: albumFolder, es: albumFolder };
    await writeFile(path, JSON.stringify({ title: albumFolder, name, order: Math.max(0, ...orders) + 10 }, null, 2) + '\n');
    albumNames[albumFolder] = { slug, name };
    console.log(`  New album: ${albumFolder}`);
  }
}

// New photos go after the existing ones.
const existing = await Promise.all(
  (await readdir(PHOTOS)).filter((f) => f.endsWith('.json')).map(async (f) => JSON.parse(await readFile(join(PHOTOS, f), 'utf8')).order ?? 100)
);
let order = Math.max(0, ...existing);

for (const job of jobs.sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }))) {
  const raw = basename(job.file, extname(job.file));
  const slug = unique(PHOTOS, slugify(raw), '.json');
  const album = job.album ? albumNames[job.album] : null;
  await sharp(job.file)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(join(OUT, `${slug}.webp`));
  order += 10;
  const altEn = album ? `Aniposada — ${album.name.en}` : 'Aniposada';
  const altEs = album ? `Aniposada — ${album.name.es}` : 'Aniposada';
  await writeFile(
    join(PHOTOS, `${slug}.json`),
    JSON.stringify(
      { title: titleCase(raw), image: `/images/gallery/${slug}.webp`, album: album?.slug ?? null, alt: { en: altEn, es: altEs }, order },
      null,
      2
    ) + '\n'
  );
  await unlink(job.file);
  console.log(`  + ${job.file} → ${slug}${album ? ` (${album.name.en})` : ''}`);
}
console.log(`Added ${jobs.length} photo(s) to the gallery. Descriptions can be edited in /keystatic → Gallery photos.`);
