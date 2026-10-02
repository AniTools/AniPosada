# Aniposada

Music website for Aniposada — singer-songwriter & producer. Built with
[Astro](https://astro.build), in English (`/`) and Spanish (`/es/`).

## Run it on your computer

```bash
npm install      # first time only
npm run dev
```

Then open http://localhost:4321

## Add photos, videos, releases and shows

With `npm run dev` running, open **http://localhost:4321/keystatic**:

| Section          | What you can do                                                     |
| ---------------- | ------------------------------------------------------------------- |
| Gallery albums   | One per photoshoot (e.g. Sunset Vibes). Tabs appear once there are 2+. |
| Gallery photos   | Upload a photo, pick its album, add a short description (EN/ES).    |
| Videos           | Paste a YouTube link. Tick "Feature" to show it big at the top.      |
| Releases         | Cover art + Spotify / Apple Music / YouTube links.                   |
| Shows            | Date, venue, city, ticket link. Past shows hide themselves.          |
| Services         | Title + description in both languages, and an icon.                 |
| Site settings    | Hero text & photo, About text & photo, quick facts, phone, socials.  |

Sections with nothing in them (Releases, Shows) stay hidden until you add something.

## Publish

```bash
./publish.sh "Added new photos"
```

This commits your changes and pushes to GitHub; Netlify rebuilds the live site.

## Contact form

The form uses **Netlify Forms**. Choose where messages are emailed in
Netlify → your site → Forms → Form notifications → Add notification → Email
(e.g. hello@aniposada.com).
