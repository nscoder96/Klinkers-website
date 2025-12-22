# Klinkers & Co - Website

De website van Klinkers & Co, de hovenier van Gouda en omstreken.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude API (Anthropic)
- **Hosting:** Vercel

## Lokaal draaien

```bash
# Dependencies installeren
npm install

# Development server starten
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Kopieer `.env.example` naar `.env.local` en vul in:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `ANTHROPIC_API_KEY` - Claude API key

## Database Setup

Run het SQL schema in Supabase SQL Editor:
```
src/lib/supabase/schema.sql
```

## Deployment

Push naar main branch voor automatische Vercel deployment.
