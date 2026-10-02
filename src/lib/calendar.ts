import type { CollectionEntry } from 'astro:content';

/* Shows are entered as a date plus free-text time ("7:30 PM", "8pm", "20:00")
   in Vancouver local time. Without a recognisable time the event is all-day. */
export const TIMEZONE = 'America/Vancouver';
const DEFAULT_HOURS = 2;

type Show = CollectionEntry<'shows'>;

function parseTime(text: string): [number, number] | null {
  const m = text.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?\s*m?\.?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const ampm = m[3]?.toLowerCase();
  if (ampm === 'p' && h < 12) h += 12;
  if (ampm === 'a' && h === 12) h = 0;
  return h < 24 && min < 60 ? [h, min] : null;
}

const pad = (n: number) => String(n).padStart(2, '0');
const compact = (date: string) => date.replaceAll('-', '');

function range(show: Show) {
  const t = parseTime(show.data.time);
  if (!t) {
    const next = new Date(`${show.data.date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return { allDay: true, start: compact(show.data.date), end: compact(next.toISOString().slice(0, 10)) };
  }
  // Wall-clock arithmetic in UTC fields; the timezone is attached separately.
  const start = new Date(`${show.data.date}T${pad(t[0])}:${pad(t[1])}:00Z`);
  const end = new Date(start.getTime() + DEFAULT_HOURS * 3600_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace(/[-:]/g, '');
  return { allDay: false, start: fmt(start), end: fmt(end) };
}

export const location = (show: Show) => [show.data.venue, show.data.city].filter(Boolean).join(', ');

export function googleCalendarUrl(show: Show, details: string) {
  const r = range(show);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Aniposada — ${show.data.title}`,
    dates: `${r.start}/${r.end}`,
    location: location(show),
    details,
  });
  if (!r.allDay) params.set('ctz', TIMEZONE);
  return `https://calendar.google.com/calendar/render?${params}`;
}

// Pacific time rules, so strict clients (Outlook) don't need to guess the zone.
const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TIMEZONE}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:-0800',
  'TZOFFSETTO:-0700',
  'TZNAME:PDT',
  'DTSTART:19700308T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:-0700',
  'TZOFFSETTO:-0800',
  'TZNAME:PST',
  'DTSTART:19701101T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

export function icsFile(show: Show, details: string, url: string) {
  const r = range(show);
  const when = r.allDay
    ? [`DTSTART;VALUE=DATE:${r.start}`, `DTEND;VALUE=DATE:${r.end}`]
    : [`DTSTART;TZID=${TIMEZONE}:${r.start}`, `DTEND;TZID=${TIMEZONE}:${r.end}`];
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aniposada//Shows//EN',
    'CALSCALE:GREGORIAN',
    ...(r.allDay ? [] : VTIMEZONE),
    'BEGIN:VEVENT',
    `UID:${show.id}@aniposada.com`,
    `DTSTAMP:${stamp}`,
    ...when,
    `SUMMARY:${escape(`Aniposada — ${show.data.title}`)}`,
    `LOCATION:${escape(location(show))}`,
    `DESCRIPTION:${escape(details)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
