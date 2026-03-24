# Harris School Digest

A Next.js dashboard that gives Harris school parents a clean, searchable view of AI-summarised school emails and upcoming calendar events.

## Features

- **Email Feed** — browse AI-generated summaries of school communications, filter by tag, and search by subject, sender, or content
- **Calendar** — view extracted school events grouped by month, filterable by type (Deadline, Event, Sport, etc.) and year group (Reception – Year 6)
- **Detail panels** — slide-in panels show the full email body or event details without leaving the page
- **Attachment indicator** — emails with PDF attachments are flagged in the card

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Date utils | date-fns |

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd harris-dash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up Supabase tables

You need two tables in your Supabase project:

**`email_summaries`**
| Column | Type |
|---|---|
| id | uuid (PK) |
| subject | text |
| sender | text |
| date_received | timestamptz |
| summary | text |
| body | text |
| tags | text[] |
| has_attachment | boolean |

**`calendar_events`**
| Column | Type |
|---|---|
| id | uuid (PK) |
| title | text |
| event_date | date |
| event_type | text |
| description | text |
| action_text | text |
| source_email_id | uuid (FK → email_summaries) |

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects automatically to `/feed`.

## Project Structure

```
app/
  layout.tsx          # Header with tab navigation
  page.tsx            # Redirects / → /feed
  feed/page.tsx       # Email feed page
  calendar/page.tsx   # Calendar events page
components/
  EmailCard.tsx
  EmailDetailPanel.tsx
  CalendarEventItem.tsx
  CalendarEventPanel.tsx
lib/
  supabase.ts         # Supabase client
  types.ts            # Shared TypeScript types
```

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```
