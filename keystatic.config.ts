import { config, fields, collection, singleton } from '@keystatic/core';

/* Everything visitors read exists in English and Spanish, so text fields come
   in pairs. The site shows the one matching the page language. */
const bi = (label: string, opts: { multiline?: boolean; description?: string } = {}) =>
  fields.object(
    {
      en: fields.text({ label: 'English', multiline: opts.multiline }),
      es: fields.text({ label: 'Español', multiline: opts.multiline }),
    },
    { label, description: opts.description, layout: [6, 6] }
  );

const image = (label: string, folder: string, description?: string) =>
  fields.image({
    label,
    description,
    directory: `public/images/${folder}`,
    publicPath: `/images/${folder}/`,
    validation: { isRequired: true },
  });

export default config({
  // `local` edits the files in this project directly — no account needed.
  // Run `npm run dev`, open http://localhost:4321/keystatic, then publish
  // by pushing to GitHub. To edit from any browser after deploying, swap in:
  //   storage: { kind: 'github', repo: 'AniTools/AniPosada' }
  storage: { kind: 'local' },

  ui: {
    brand: { name: 'AniPosada' },
    navigation: {
      Media: ['albums', 'photos', 'videos', 'releases'],
      Live: ['shows', 'services'],
      Settings: ['site'],
    },
  },

  collections: {
    albums: collection({
      label: 'Gallery albums',
      slugField: 'title',
      path: 'src/content/albums/*',
      format: { data: 'json' },
      columns: ['title', 'order'],
      schema: {
        title: fields.slug({
          name: { label: 'Album name (internal)', validation: { isRequired: true } },
        }),
        name: bi('Album name shown on the site', { description: 'e.g. "Sunset Vibes" / "Atardecer"' }),
        order: fields.integer({
          label: 'Order',
          description: 'Lower numbers show first in the album tabs.',
          defaultValue: 100,
        }),
      },
    }),

    photos: collection({
      label: 'Gallery photos',
      slugField: 'title',
      path: 'src/content/photos/*',
      format: { data: 'json' },
      columns: ['title', 'order'],
      schema: {
        title: fields.slug({
          name: { label: 'Title', description: 'Only for you — helps you find the photo here.' },
        }),
        image: image('Photo', 'gallery', 'JPG or WebP, ideally under 2 MB and about 2000px on the long side.'),
        album: fields.relationship({
          label: 'Album',
          description: 'Which photoshoot this belongs to. Create albums under "Gallery albums".',
          collection: 'albums',
        }),
        alt: bi('Description', {
          description: 'What is in the photo, for screen readers and Google. e.g. "Ani playing guitar by the water".',
        }),
        order: fields.integer({
          label: 'Order',
          description: 'Lower numbers show first.',
          defaultValue: 100,
        }),
      },
    }),

    videos: collection({
      label: 'Videos',
      slugField: 'title',
      path: 'src/content/videos/*',
      format: { data: 'json' },
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Title', validation: { isRequired: true } } }),
        youtube: fields.url({
          label: 'YouTube link',
          description: 'Paste the link from YouTube, e.g. https://www.youtube.com/watch?v=EsezEDYw_lk',
          validation: { isRequired: true },
        }),
        date: fields.date({ label: 'Release date', validation: { isRequired: true } }),
        featured: fields.checkbox({
          label: 'Feature this video',
          description: 'Shown big at the top of the Videos section. If several are ticked, the newest wins.',
          defaultValue: false,
        }),
      },
    }),

    releases: collection({
      label: 'Releases',
      slugField: 'title',
      path: 'src/content/releases/*',
      format: { data: 'json' },
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Title', validation: { isRequired: true } } }),
        kind: fields.select({
          label: 'Type',
          options: [
            { label: 'Single', value: 'single' },
            { label: 'EP', value: 'ep' },
            { label: 'Album', value: 'album' },
          ],
          defaultValue: 'single',
        }),
        date: fields.date({ label: 'Release date', validation: { isRequired: true } }),
        cover: image('Cover art', 'releases', 'Square image, at least 800×800.'),
        spotify: fields.url({ label: 'Spotify link', validation: { isRequired: false } }),
        appleMusic: fields.url({ label: 'Apple Music link', validation: { isRequired: false } }),
        youtube: fields.url({ label: 'YouTube link', validation: { isRequired: false } }),
      },
    }),

    shows: collection({
      label: 'Shows',
      slugField: 'title',
      path: 'src/content/shows/*',
      format: { data: 'json' },
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({
          name: { label: 'Show name', description: 'e.g. "The Book Fair 2026"', validation: { isRequired: true } },
        }),
        venue: fields.text({ label: 'Venue / address', description: 'e.g. "Ocean Artworks Pavilion, 1531 Johnston St"' }),
        date: fields.date({
          label: 'Date',
          description: 'Past shows hide themselves automatically.',
          validation: { isRequired: true },
        }),
        time: fields.text({ label: 'Time', description: 'e.g. 8:00 PM' }),
        city: fields.text({ label: 'City', validation: { isRequired: true } }),
        note: bi('Note', { description: 'Optional, e.g. "Acoustic set" / "Set acústico".' }),
        link: fields.url({
          label: 'Tickets or info link',
          validation: { isRequired: false },
        }),
      },
    }),

    services: collection({
      label: 'Services',
      slugField: 'name',
      path: 'src/content/services/*',
      format: { data: 'json' },
      columns: ['name', 'order'],
      schema: {
        name: fields.slug({ name: { label: 'Internal name', validation: { isRequired: true } } }),
        title: bi('Title'),
        description: bi('Description', { multiline: true }),
        icon: fields.select({
          label: 'Icon',
          options: [
            { label: 'Microphone', value: 'mic' },
            { label: 'Sliders (production)', value: 'sliders' },
            { label: 'Pen (songwriting)', value: 'pen' },
            { label: 'Guitar', value: 'guitar' },
            { label: 'Headphones', value: 'headphones' },
            { label: 'Heart', value: 'heart' },
          ],
          defaultValue: 'mic',
        }),
        order: fields.integer({ label: 'Order', defaultValue: 100 }),
      },
    }),
  },

  singletons: {
    site: singleton({
      label: 'Site settings',
      path: 'src/content/site',
      format: { data: 'json' },
      schema: {
        tagline: bi('Hero tagline', { description: 'Under your name at the top.' }),
        intro: bi('Hero quote', { multiline: true }),
        heroImage: image('Hero photo', 'site'),
        spotifyArtistId: fields.text({
          label: 'Spotify artist ID',
          description: 'The code after /artist/ in your Spotify link.',
        }),
        aboutHeading: bi('About heading'),
        aboutQuote: bi('About pull quote', { multiline: true }),
        aboutBody: fields.array(bi('Paragraph', { multiline: true }), {
          label: 'About paragraphs',
          itemLabel: (p) => (p.fields.en.value || 'Paragraph').slice(0, 60),
        }),
        aboutImage: image('About photo', 'site'),
        facts: fields.array(
          fields.object({ label: bi('Label'), value: bi('Value') }),
          {
            label: 'Quick facts',
            description: 'Short facts shown beside your bio.',
            itemLabel: (p) => `${p.fields.label.fields.en.value}: ${p.fields.value.fields.en.value}`,
          }
        ),
        bookingUrl: fields.url({ label: 'Book-a-call link', validation: { isRequired: false } }),
        supportUrl: fields.url({
          label: 'Buy Me a Coffee link',
          description: 'e.g. https://buymeacoffee.com/yourname. Leave empty to hide the Support section.',
          validation: { isRequired: false },
        }),
        supportHeading: bi('Support heading'),
        supportBody: bi('Support text', { multiline: true }),
        phone: fields.text({ label: 'Phone' }),
        email: fields.text({
          label: 'Email',
          description: 'Shown on the Contact section. Leave empty to hide. (Where form messages go is set in Netlify → Forms → Notifications.)',
        }),
        socials: fields.array(
          fields.object({
            platform: fields.select({
              label: 'Platform',
              options: [
                { label: 'Instagram', value: 'instagram' },
                { label: 'YouTube', value: 'youtube' },
                { label: 'Spotify', value: 'spotify' },
                { label: 'TikTok', value: 'tiktok' },
                { label: 'Apple Music', value: 'apple' },
                { label: 'Facebook', value: 'facebook' },
              ],
              defaultValue: 'instagram',
            }),
            url: fields.url({ label: 'Link' }),
          }),
          { label: 'Social links', itemLabel: (p) => p.fields.platform.value }
        ),
      },
    }),
  },
});
