import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { icsFile } from '../../lib/calendar';

/* One downloadable calendar file per show: /shows/<show>.ics */
export const getStaticPaths = (async () =>
  (await getCollection('shows')).map((show) => ({ params: { id: show.id }, props: { show } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props, site }) => {
  const show = (props as { show: CollectionEntry<'shows'> }).show;
  const details = [show.data.time, show.data.note.en, show.data.link ?? ''].filter(Boolean).join('\n');
  return new Response(icsFile(show, details, new URL('/#shows', site).href), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="aniposada-${show.id}.ics"`,
    },
  });
};
