/* Builds the favicon set and the social sharing image from the logo SVGs and
   the hero photo. Re-run (`node scripts/make-icons.mjs`) if those change. */
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const logo = await readFile('src/components/Logo.astro', 'utf8');
const [mark, wordmark] = [...logo.matchAll(/const (?:mark|wordmark) = (\[[\s\S]*?\]);/g)].map((m) => JSON.parse(m[1]));
const paths = (ds, fill) => ds.map((d) => `<path fill="${fill}" d="${d}"/>`).join('');

const INK = '#110d0b';
const SUN = '#f5a27a';
const CREAM = '#f3e9dc';

/* App/home-screen icon: cream monogram on a sunset-gradient rounded tile. */
const tile = (size, radius) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffd2a8"/><stop offset=".5" stop-color="${SUN}"/><stop offset="1" stop-color="#e0786a"/>
  </linearGradient></defs>
  <rect width="512" height="512" rx="${radius}" fill="url(#g)"/>
  <svg x="86" y="96" width="340" height="320" viewBox="0 0 481.13 432.43">${paths(mark, INK)}</svg>
</svg>`;

const png = (svg) => sharp(Buffer.from(svg)).png();
await png(tile(180, 0)).resize(180, 180).toFile('public/apple-touch-icon.png'); // iOS rounds corners itself
await png(tile(192, 96)).resize(192, 192).toFile('public/icon-192.png');
await png(tile(512, 96)).resize(512, 512).toFile('public/icon-512.png');
await png(tile(512, 0)).resize(512, 512).toFile('public/icon-maskable.png');

/* favicon.ico (32px, PNG-in-ICO) for browsers and crawlers that ask for it. */
const ico32 = await png(tile(32, 96)).resize(32, 32).toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
header.writeUInt32LE(ico32.length, 14); header.writeUInt32LE(22, 18);
await writeFile('public/favicon.ico', Buffer.concat([header, ico32]));

/* Sharing image (1200×630): sunset photo on the right, signature on the left. */
const W = 1200, H = 630;
const photo = await sharp('public/images/site/hero.webp')
  .resize({ width: 560, height: H, fit: 'cover', position: 'attention' })
  .toBuffer();
const overlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="glow" cx="0.75" cy="0" r="0.9"><stop offset="0" stop-color="${SUN}" stop-opacity=".35"/><stop offset="1" stop-color="${SUN}" stop-opacity="0"/></radialGradient>
    <linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="${INK}"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></linearGradient>
  </defs>
  <rect x="640" width="140" height="${H}" fill="url(#fade)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <svg x="70" y="150" width="560" height="200" viewBox="0 0 790.59 282.35">${paths(wordmark, CREAM)}</svg>
  <rect x="78" y="398" width="44" height="2" fill="${SUN}"/>
  <text x="140" y="405" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="600" letter-spacing="5" fill="${SUN}">SINGER-SONGWRITER · PRODUCER</text>
  <text x="78" y="455" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="${CREAM}" fill-opacity=".75">Colombian roots, Canadian home.</text>
</svg>`;
await sharp({ create: { width: W, height: H, channels: 3, background: INK } })
  .composite([{ input: photo, left: W - 560, top: 0 }, { input: Buffer.from(overlay), left: 0, top: 0 }])
  .jpeg({ quality: 84 })
  .toFile('public/og-image.jpg');

console.log('Icons and og-image.jpg written to public/');
