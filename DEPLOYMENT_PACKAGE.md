# Deploying a New Company Instance

This platform is a **single-tenant package**: every client company gets its
own private deployment — their own database, their own website, their own
branding. No company ever shares a database with another.

Per client you create:
1. A **Supabase project** (their private database + photo storage)
2. A **Vercel project** (their website + back office), pointed at this repo
3. **Environment variables** that brand the instance for them

Total setup time per client: about 30 minutes.

---

## 1. Create the client's Supabase project

1. [supabase.com](https://supabase.com) → New project (name it after the client)
2. Once ready: **SQL Editor → New query**, then run each migration file from
   `supabase/migrations/` **in order** (001 through the latest, one at a time)
3. Note down from **Project Settings → API**:
   - Project URL (`https://xxxx.supabase.co`)
   - `anon` public key

### Auth setting (recommended)
**Authentication → Providers → Email**: decide whether to require email
confirmation. For a small crew, turning confirmation off makes onboarding
staff simpler.

## 2. Create the client's Vercel project

1. [vercel.com](https://vercel.com) → Add New Project → import this repository
2. Framework preset: Next.js (defaults are fine)
3. Add the environment variables below **before** the first deploy
4. Deploy, then add their custom domain under **Settings → Domains**
   (e.g. `greenscapepros.com` or `lawn.clientdomain.com`)

## 3. Environment variables

Only three are required — branding is NOT done with env vars (see step 4):

| Variable | Example | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Their private database |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Their database public key |
| `NEXT_PUBLIC_APP_URL` | `https://greenscapepros.com` | Their site URL |
| `NEXT_PUBLIC_PAYMENT_MODE` | `mock` | `mock` until their Stripe is set up |
| `NEXT_PUBLIC_EMAIL_MODE` | `mock` | `mock` until their email provider is set up |

Optional fallbacks: `NEXT_PUBLIC_COMPANY_NAME` / `_TAGLINE` / `_PHONE` /
`_EMAIL` / `_SERVICE_AREA` / `_EMOJI` render before the database has
branding saved — useful only for the very first minutes of a fresh
instance. Once Business Settings is filled in, the database wins.

Optional (when the client is ready for real integrations): Twilio
credentials for SMS, Stripe keys for payments.

## 4. Onboard the client (first session together)

1. **Owner account**: they sign up at `/auth/signup` — first login
   auto-creates their company record
2. **Business Settings** (`/admin/settings`): enter their name, tagline,
   phone, email, service area, and logo emoji — this brands their public
   website and quote form instantly, no redeploy needed
3. **Services & Pricing** (`/admin/services`): enter their real service
   catalog with prices — this powers the public price menu on their homepage
   and job pricing
4. **Customers & properties**: add a few key customers, their properties,
   property photos, and workflows
5. **Calendar** (`/admin/calendar`): block out any vacations and their daily
   lunch break
6. **Service plans**: set up recurring plans (interval + special rate) for
   their regular customers
7. **Crew accounts**: crew members sign up, and you set their role to `crew`
   in the database (`users` table)

## 5. Lead funnel setup

Their homepage is the marketing site; the quote form is at `/leads/capture`.
Give the client tagged links to use in ads and social bios so every lead is
attributed automatically:

- Facebook/Instagram bio: `https://theirsite.com/leads/capture?src=social`
- Google Ads: `https://theirsite.com/leads/capture?utm_source=google&utm_campaign=spring`
- Referral cards: `https://theirsite.com/leads/capture?src=referral`

Leads land in **Admin → Leads** scored and source-tagged, ready for the
pipeline (contact → quote → won → convert to customer).

---

## Maintaining all client instances

All clients run from this one repository. When you improve the product:

1. Push to `main`
2. Every client's Vercel project redeploys automatically
3. If the release includes a new migration file, run it in **each** client's
   Supabase SQL editor (migrations are idempotent — safe to re-run)

Keep a simple spreadsheet of clients → Supabase project → Vercel project →
last migration applied.
