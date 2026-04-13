# Harris School Digest — Claude Code Guide

## Project Overview
A Next.js dashboard for Harris Primary Academy Beckenham parents to browse AI-summarised school emails, calendar events, and get AI-powered answers to school questions. Data is stored in Supabase and populated by a separate Google Apps Script ingestion pipeline.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v3
- **Database:** Supabase (PostgreSQL + pgvector)
- **Key libraries:** `date-fns`, `@supabase/supabase-js`, `@fortawesome/react-fontawesome`

## Project Structure
```
app/
  layout.tsx            # Root layout — header + dual nav (desktop top bar / mobile bottom bar)
  page.tsx              # Redirects / → /home
  home/page.tsx         # Dashboard: school status, weather, PE reminder, latest emails, upcoming events
  feed/page.tsx         # Email feed with search + tag filters + detail panel
  calendar/page.tsx     # Calendar events with date, type, year-group filters
  ask/page.tsx          # RAG-powered Ask page — natural language Q&A
  learning/page.tsx     # Phonics lesson tracker with egg-hatch gamification
  zoo/page.tsx          # Physics-animated zoo of collected animals from learning page
  login/page.tsx        # Password login page
  api/
    ask/route.ts        # Server-side RAG: embeds query → vector search → Gemini answer
    auth/route.ts       # Password verification → sets harris-auth cookie
    weather/route.ts    # OpenWeatherMap proxy for Beckenham forecast
middleware.ts           # Route protection — redirects unauthenticated users to /login
components/
  EmailCard.tsx         # Card component for email list
  EmailDetailPanel.tsx  # Slide-in panel for full email detail (mobile: full-screen)
  CalendarEventItem.tsx # Row component for calendar list
  CalendarEventPanel.tsx# Slide-in panel for event detail (mobile: full-screen)
lib/
  supabase.ts           # Supabase client (uses NEXT_PUBLIC_ env vars)
  types.ts              # Shared TypeScript types (EmailSummary, CalendarEvent, WeatherData)
  animals.ts            # Animal emoji + fun facts for zoo/learning gamification
apps-script/
  Code.gs               # Email ingestion pipeline (reference copy — do not edit here)
  RagIngestion.gs       # RAG ingestion: website scraper, email embedder, PDF embedder
```

## Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL (public, client-safe)
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key (public, client-safe)
SUPABASE_SERVICE_KEY=           # Server-side only — bypasses RLS for vector search
GEMINI_API_KEY=                 # Server-side only — used by /api/ask for embeddings + generation
SITE_PASSWORD=                  # Single shared password for the app login
OPENWEATHER_API_KEY=            # OpenWeatherMap free-tier key for /api/weather
```
Also add all server-side vars to Vercel environment variables.

## Authentication
- Single shared password stored in `SITE_PASSWORD` env var
- Login POSTs to `/api/auth`, which sets an httpOnly cookie `harris-auth=1`
  - Cookie: `httpOnly: true`, `secure: true` (prod only), `sameSite: 'lax'`, `maxAge: 10 years` (intentional — family device, never expires)
- `middleware.ts` checks the cookie on every request and redirects to `/login` if missing
- Public paths (no auth required): `/login`, `/api/auth`
- Static assets bypassed: `/_next`, `/favicon*`, `/logo*`, `/icons*`, `.png`, `.ico`, `.svg`, `.webp`, `/manifest.json`

## Supabase Tables
- `email_summaries` — AI-summarised emails with `subject`, `sender`, `date_received`, `summary`, `body`, `tags[]`, `has_attachment`, `pdf_filename`, `pdf_drive_url`, `gmail_message_id`, `processed_at`
- `calendar_events` — Extracted events with `title`, `event_date`, `event_type`, `description`, `action_text`, `source_email_ids[]`, `first_seen`, `last_mentioned`
- `rag_documents` — Vector embeddings for RAG with `content`, `embedding` (vector 3072), `source_type`, `source_label`, `source_url`, `source_email_id`. **RLS enabled** — no public policy; only accessible via service role key.

### RAG / Vector Search
- Embedding model: `gemini-embedding-001` (3072 dimensions) via Google AI Studio free tier
- Generation model: `gemini-2.5-flash`
- Supabase function: `match_documents(query_embedding, match_threshold, match_count)` — cosine similarity search
- `match_threshold`: `0.45` — adjust if results are too loose (increase) or too few (decrease)
- `match_count`: `8` chunks per query
- Generation: `maxOutputTokens: 1024`, `temperature: 0.2` (low temp = factual)
- No vector index (sequential scan) — sufficient for small dataset; HNSW/IVFFlat both cap at 2000 dims
- **Do not** switch embedding model from `gemini-embedding-001` — the Supabase column is `vector(3072)` and all existing embeddings would break

## Home Page (`app/home/page.tsx`)

### School Status Logic
The status badge shows a time- and date-aware message computed by `getSchoolStatus()`.

**Priority order:**
1. **Term break / INSET day** — checked first against `TERM_BREAKS` array (see below)
   - For non-inset last days (1:30pm finish), school logic runs until 13:30 even during a break's start date
2. **Weekend** — shows "Enjoy the weekend — back on Monday at 8:25am"
3. **Half day** — detected from calendar events containing "half day", "inset", or "1:30" in title/description
4. **Time-based status:**
   - Before 08:25 → "School gates open at 8:25am"
   - 08:25–08:45 → "Gates are open — see you inside!"
   - 08:45–14:30 → "School is in session"
   - 14:30–15:30 → "School finishes at 3:30pm"
   - 15:30–18:00 → "After-school club finishes at 6pm" (on `CLUB_DAYS`) OR "School is out for the day"
   - After 18:00 → "School closed — see you tomorrow/Monday"

### Hard-Coded Term Breaks (2025–26 academic year)
Update these every August for the new school year in `TERM_BREAKS` at the top of `app/home/page.tsx`:

| Label | Start | End | Back | Inset? |
|---|---|---|---|---|
| INSET days | 2025-09-01 | 2025-09-02 | Wednesday 3rd September | ✅ |
| INSET day | 2025-10-10 | 2025-10-10 | Monday 13th October | ✅ |
| Half term | 2025-10-17 | 2025-11-02 | Monday 3rd November | ❌ |
| Christmas | 2025-12-19 | 2026-01-04 | Monday 5th January | ❌ |
| Half term | 2026-02-12 | 2026-02-22 | Monday 23rd February | ❌ |
| Easter holidays | 2026-03-27 | 2026-04-12 | Monday 13th April | ❌ |
| Bank holiday | 2026-05-04 | 2026-05-04 | Tuesday 5th May | ✅ |
| Half term | 2026-05-22 | 2026-05-31 | Monday 1st June | ❌ |
| Summer holidays | 2026-07-17 | 2026-09-06 | Autumn Term 2026 | ❌ |

- `inset: true` — no school all day (treated as a full closure)
- `inset: false` — last school day has 1:30pm finish; school logic still runs until 13:30

### After-School Club Days
```typescript
const CLUB_DAYS = [1, 3, 4, 5] // Mon, Wed, Thu, Fri
```
After 15:30 on club days, the status shows "After-school club finishes at 6pm". Update this if club schedule changes.

### PE Kit Reminder Banner
Shown in the weather section when school is in session on or before a PE day.

**PE days: Monday (day 1) and Thursday (day 4)**

```typescript
const todayInBreak    = TERM_BREAKS.find(b => todayStr    >= b.start && todayStr    <= b.end)
const tomorrowInBreak = TERM_BREAKS.find(b => tomorrowStr >= b.start && tomorrowStr <= b.end)
// "PE today" — on a PE day, during term, not a weekend
const isPeToday    = !todayInBreak && !isWeekend(now) && (day === 1 || day === 4)
// "PE tomorrow" — day before a PE day, as long as tomorrow is a school day
const isPeTomorrow = !tomorrowInBreak && (day === 0 || day === 3) // Sun→Mon or Wed→Thu
const showPeReminder = isPeToday || isPeTomorrow
```

- Suppressed automatically during any term break or INSET day (today or tomorrow)
- Shows "Don't forget — PE kit today for Year 1!" or "...tomorrow..."
- To change PE days: update `day === 1 || day === 4` (isPeToday) and `day === 0 || day === 3` (isPeTomorrow)

### Weather Integration (`app/api/weather/route.ts`)
- **Location:** Beckenham, BR3 — `lat: 51.4088, lon: -0.0225`
- **API:** OpenWeatherMap 5-day/3-hour forecast (free tier)
- **Logic:** Picks midday (12:00:00) entry per day; falls back to first available
- **Cache:** Next.js `revalidate: 600` (10 min) + CDN `s-maxage: 600`
- **Clothing tip thresholds:**
  - ≤4°C → "Jumper + Thick Jacket" (+ Waterproof if wet/snow/storm)
  - ≤10°C → "Jumper + Light Jacket" (+ Waterproof if wet)
  - ≤16°C → "Jumper" (+ Waterproof if wet)
  - ≤21°C → "Just a Jumper" or Waterproof if wet
  - >21°C → No layers / just Waterproof if wet

### Tag Cards (Home Page)
- Tags are split into "Year 1" section vs general trending tags
- Year 1 detection (`isYear1Tag`): contains 'year 1', 'yr1', 'y1', or 'phonics' (case-insensitive)
- Trending: first 8 non-Year-1 tags from latest 20 emails
- `TAG_EMOJIS` map: 21 emoji mappings defined in `home/page.tsx`

## Feed Page (`app/feed/page.tsx`)
- Search filters across: `subject`, `summary`, `sender` (case-insensitive, client-side)
- Tag filter buttons (toggle active/inactive)
- URL params: `?email={id}` auto-opens email detail, `?tag={name}` pre-selects tag filter
- Fetches latest 20 emails ordered by `date_received DESC`

## Calendar Page (`app/calendar/page.tsx`)
- Filters: Upcoming / Past / All | Event type | Year group
- Year group terms matched case-insensitively across `title + description + action_text`:
  - Rec: `['reception', 'eyfs', 'nursery']`
  - Y1: `['year 1', 'y1', 'yr1', 'yr 1']`
  - Y2–Y6: similar pattern
- Events grouped by month (`MMMM yyyy`)
- **Event types (hard-coded):** Deadline, Event, Reminder, Closure, Finance, General, Sport, Community

## Ask Page (`app/ask/page.tsx`)
- 6 hard-coded suggested questions (editable in `SUGGESTIONS` array at top of file)
- Sources are deduplicated by label before display
- Clicking an email/PDF source navigates to `/feed?email={id}`
- Clicking a website source opens in new tab

## Learning Page (`app/learning/page.tsx`)
Phonics lesson tracker with gamification for Year 1 parents.

- Resources hard-coded in a `CATEGORIES` array with: date, title, URL, `live` flag
- Current category: **Easter Break 2026** (30 Mar – 12 Apr, 14 Ruth Miskin phonics videos)
- `live: false` resources show "—" (not yet available)
- Completed URLs saved to `localStorage` key `harris-phonics-done` (JSON array)
- Completing a lesson triggers egg-hatch animation:
  1. Shake (300ms) → Crack with sound (400ms) → Reveal animal + fun fact
  2. Sound: Web Audio API synth — crack (white noise) + 4-note arp chime
- Each lesson maps to an animal: `globalIndex % animals.length` from `ANIMALS_BY_TYPE.land`
- Progress bar shows X of Y completed

**To update for a new term:** Edit the `CATEGORIES` array — change `dateRange`, `resources` list, and mark new URLs as `live: true` as they become available.

## Zoo Page (`app/zoo/page.tsx`)
Displays animals collected from completed phonics lessons as a physics animation.

- Reads completed URLs from `localStorage` (`harris-phonics-done`) to determine which animals to show
- Real-time physics via `requestAnimationFrame` — **no React state** for animation (direct DOM refs for performance)
- Animals bounce inside a pen (4:3 aspect ratio), flip direction on movement
- **Physics constants:** `PEN_PADDING = 8%`, `EMOJI_SIZE = 5%`, max speed `0.08`, min speed `0.025`, delta capped at 3 frames
- Visibility change resets delta time to prevent position jumps on tab restore
- Do not refactor animation loop to React state — it would drop to ~10 FPS

## Components

### Detail Panels (`EmailDetailPanel`, `CalendarEventPanel`)
- Controlled by `open: boolean` prop from parent
- **Mobile:** Fixed full-screen overlay, slides in from right (300ms transition)
- **Desktop (md:):** Static 420px right sidebar, no transition
- `EmailDetailPanel`: splits summary into bullet points by sentence (`(?<=[.!?])\s+`)
- `CalendarEventPanel`: fetches related events sharing any source email; shows source email list

## Shared Types (`lib/types.ts`)
- `EmailSummary` — matches `email_summaries` table
- `CalendarEvent` — matches `calendar_events` table
- `WeatherForecast` — `{ temp, high, low, description, icon }`
- `WeatherData` — `{ today: WeatherForecast, tomorrow: WeatherForecast, clothingTip: string }`
- `EVENT_TYPE_COLOURS` — maps each of 8 event types to a hex colour (used for left borders, badges)
- `EVENT_TYPE_BG` — maps each event type to a Tailwind `bg-*` class

## Animals (`lib/animals.ts`)
43 animals across 3 habitats, each with `{ emoji, name, type, funFact }`:
- `land` (15): Lion, Tiger, Elephant, Fox, Bear, Giraffe, Zebra, Panda, Kangaroo, Koala, Hedgehog, Wolf, Raccoon, Frog, Tortoise
- `ocean` (14): Dolphin, Shark, Clownfish, Octopus, etc.
- `sky` (14): Parrot, Eagle, Swan, Flamingo, etc.

Currently only `land` animals are used (learning + zoo pages). `ocean` and `sky` are reserved for future gamification.

## Navigation (`app/layout.tsx`)
- **Desktop:** horizontal top nav bar (hidden on mobile)
- **Mobile:** fixed bottom tab bar (5 icons)
- Tabs: Home (`/home`), Emails (`/feed`), Calendar (`/calendar`), Ask (`/ask`), Learning (`/learning`)
- PWA configured: manifest, icons, `apple-mobile-web-app-capable`, theme colour `#1A1A1A`

## Brand / Design Tokens
- Primary red: `#D00A2C`
- Dark background: `#1A1A1A`
- Card border: `#E5E7EB`
- Body text: `#111827`
- Muted text: `#6B7280`
- Secondary text: `#374151`
- Font: Inter (Google Fonts, weights 400/500/600/700)

## Coding Conventions
- All pages are client components (`'use client'`) — data is fetched client-side via Supabase JS
- Use Tailwind utility classes; avoid inline styles
- Keep components in `/components`, shared types in `lib/types.ts`
- Detail panels slide in from the right with an `open` boolean prop controlling the transition
- `/api/*` routes are server components and can safely use server-only env vars (`SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `SITE_PASSWORD`, `OPENWEATHER_API_KEY`)

## Dev Commands
```bash
npm run dev    # Start dev server (localhost:3000)
npm run build  # Production build
npm run lint   # ESLint
```

---

## Google Apps Script Pipeline (`apps-script/Code.gs`)
The ingestion pipeline runs entirely in Google Apps Script — **do not edit this file from the Next.js project**. It lives at `apps-script/Code.gs` as a reference copy only.

### What the pipeline does
1. **Trigger:** Runs `processNewSchoolEmails()` daily (weekdays only). A separate `processAllSchoolEmails()` function is used for bulk historical backfill.
2. **Gmail search:** Finds unprocessed school emails using subject/body keywords (`beckenham`, `harris`, `primary academy`, `bromcomcloud`). Processed emails get a Gmail label `school-digest-processed`.
3. **PDF handling:** Finds PDF attachments, uploads them to a Google Drive folder called **"School Email PDFs"** (publicly shared, view-only), and runs Drive OCR (`Drive.Files.create` with `mimeType: google-apps.document`) to extract text.
4. **Gemini API:** Calls `gemini-2.5-flash` (free tier, 1,500 req/day) with email body + PDF text to produce a JSON `{ summary, tags, events[] }`.
5. **Supabase writes:** Inserts into `email_summaries` and upserts into `calendar_events` (deduplication by date + title prefix).
6. **Forwarded email parsing:** Extracts original sender/subject from Gmail, Hotmail, and Outlook forwarded message formats.

### Apps Script config (stored in Script Properties, not in code)
| Property | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio free-tier key |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (bypasses RLS) |

### Key Apps Script functions
- `processMessage(message)` — full pipeline for a single email
- `uploadPdfToDrive(attachment)` — saves PDF, returns shareable Drive URL
- `extractTextFromPdf(attachment)` — Drive OCR, returns plain text, deletes temp file
- `callGeminiApi(emailBody, pdfText, subject, existingEvents)` — returns parsed JSON
- `upsertCalendarEvent(event, emailId)` — deduplicates by date + title, appends source email IDs
- `supabaseRequest(method, path, body)` — generic Supabase REST helper using `UrlFetchApp`

### Google Drive folders
- **"School Email PDFs"** — email PDF attachments, anyone with link can view
- **"School Digest Manual PDFs"** — manually dropped PDFs for RAG ingestion

## School Website
- **URL:** https://www.harrisprimarybeckenham.org.uk/
- Website is publicly accessible — no login required for scraping

### RAG Ingestion Scripts (`apps-script/RagIngestion.gs`)
Key functions — run manually from the Apps Script editor:

| Function | When to run |
|---|---|
| `scrapeAndEmbedWebsite()` | One-off + whenever site content changes. Deletes all `source_type='website'` rows and re-scrapes 62 pages. Use `Utilities.sleep(2000)` between pages to avoid rate limits. |
| `backfillEmailEmbeddings()` | One-off after deploying RAG. Embeds all existing emails not yet in `rag_documents`. Skips already-embedded emails. |
| `ingestManualPdfs()` | After dropping new PDFs into the **"School Digest Manual PDFs"** Google Drive folder. Only processes files not yet marked `rag-processed` in their Drive description. |
| `embedEmailContent(...)` | Called automatically by `processMessage()` for each new email going forward. |

### Embedding model note
The ingestion scripts use `gemini-embedding-001` (3072 dims). The `/api/ask` route must use the same model. Do **not** switch back to `text-embedding-004` (768 dims) — the Supabase column is `vector(3072)`.

---

## Annual Maintenance Checklist

### Each new academic year (August)
1. **Update `TERM_BREAKS`** in `app/home/page.tsx` — new dates, labels, back-dates, inset flags
2. **Update `CLUB_DAYS`** in `app/home/page.tsx` if after-school club schedule changes
3. **Update PE days** in `app/home/page.tsx` if PE schedule changes (currently Mon + Thu):
   - `isPeToday`: `day === 1 || day === 4`
   - `isPeTomorrow`: `day === 0 || day === 3`
4. **Update `CATEGORIES`** in `app/learning/page.tsx` with new term's phonics resources

### Each new term
1. Add new phonics resources to `app/learning/page.tsx` CATEGORIES with correct dates and URLs
2. Mark resources `live: true` as they become available each week
