import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const bi = z.object({ en: z.string().default(''), es: z.string().default('') });

const json = (dir: string) => glob({ pattern: '*.json', base: `./src/content/${dir}` });

const albums = defineCollection({
  loader: json('albums'),
  schema: z.object({ title: z.string(), name: bi, order: z.number().default(100) }),
});

const photos = defineCollection({
  loader: json('photos'),
  schema: z.object({
    title: z.string(),
    image: z.string(),
    album: z.string().nullish(),
    alt: bi,
    order: z.number().default(100),
  }),
});

const videos = defineCollection({
  loader: json('videos'),
  schema: z.object({
    title: z.string(),
    youtube: z.string(),
    date: z.coerce.date(),
    featured: z.boolean().default(false),
  }),
});

const releases = defineCollection({
  loader: json('releases'),
  schema: z.object({
    title: z.string(),
    kind: z.enum(['single', 'ep', 'album']).default('single'),
    date: z.coerce.date(),
    cover: z.string(),
    spotify: z.string().nullish(),
    appleMusic: z.string().nullish(),
    youtube: z.string().nullish(),
  }),
});

const shows = defineCollection({
  loader: json('shows'),
  schema: z.object({
    title: z.string(),
    venue: z.string().default(''),
    date: z.string(),
    time: z.string().default(''),
    city: z.string(),
    note: bi.default({ en: '', es: '' }),
    link: z.string().nullish(),
  }),
});

const services = defineCollection({
  loader: json('services'),
  schema: z.object({
    name: z.string(),
    title: bi,
    description: bi,
    icon: z.string().default('mic'),
    order: z.number().default(100),
  }),
});

export const collections = { albums, photos, videos, releases, shows, services };
