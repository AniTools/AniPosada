import { getCollection } from 'astro:content';
import sharp from 'sharp';
import site from '../content/site.json';
import type { Lang } from '../i18n/ui';

export { site };

/* Accepts any YouTube link shape (watch, youtu.be, shorts, embed) or a bare ID. */
export function youtubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/);
  return m ? m[1] : url.trim();
}

export const pick = (value: { en: string; es: string } | undefined, lang: Lang) =>
  value ? value[lang] || value.en : '';

export async function loadContent() {
  const byOrder = <T extends { data: { order: number } }>(a: T, b: T) => a.data.order - b.data.order;
  const newest = <T extends { data: { date: Date } }>(a: T, b: T) => +b.data.date - +a.data.date;

  // Read each photo's real size so the gallery can reserve space (no layout jump).
  const photos = await Promise.all(
    (await getCollection('photos')).sort(byOrder).map(async (p) => {
      const meta = await sharp(`public${p.data.image}`).metadata().catch(() => ({ width: undefined, height: undefined }));
      return Object.assign(p, { size: { width: meta.width, height: meta.height } });
    })
  );
  // Only albums that actually have photos get a tab.
  const albums = (await getCollection('albums'))
    .sort(byOrder)
    .filter((a) => photos.some((p) => p.data.album === a.id));
  const services = (await getCollection('services')).sort(byOrder);
  const releases = (await getCollection('releases')).sort(newest);
  const videos = (await getCollection('videos')).sort(newest);
  const featured = videos.find((v) => v.data.featured) ?? videos[0];

  /* Shows are filtered again in the browser so a show disappears the day
     after it happens, even if the site hasn't been rebuilt since. */
  const today = new Date().toISOString().slice(0, 10);
  const shows = (await getCollection('shows'))
    .filter((s) => s.data.date >= today)
    .sort((a, b) => a.data.date.localeCompare(b.data.date));

  return {
    photos,
    albums,
    services,
    releases,
    shows,
    featured,
    otherVideos: videos.filter((v) => v !== featured),
  };
}
