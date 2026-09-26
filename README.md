# MSSP Catalogue Builder

A web app for Managed Security Service Providers (MSSPs) to **design, tier, price and export** their managed security service catalogue. It is built for live partner workshops: one person drives the app on a projector or iPad while the MSSP team gives input, and at the end the team leaves with a branded PDF catalogue.

- **Anyone** can read the landing page and explore a read-only demo catalogue at `/preview`, without an account.
- **Signed-in users** build and keep any number of catalogues in their account (Supabase Auth and Postgres, protected by Row Level Security).

## Features

| Page | What it does |
|------|--------------|
| **Landing** (`/`) | What the app does, with *Get started*, *Try the preview* and *Sign in* |
| **Preview** (`/preview/…`) | A demo catalogue for the fictional "Sentinel Shield Managed Services". Browse the library, tiers, SLAs, pricing and coverage. Everything is read-only apart from pricing sizing, which isn't saved. Blocked actions explain why and offer sign-in. |
| **Library** | 15 editable, vendor-neutral starter services (monitoring, MDR, threat hunting, IR retainer, compliance reporting including RBI, SEBI CSCRF and DPDP Act, and more). Search, filter by category, and add, edit, duplicate or delete in a side sheet. |
| **Tiers** | Essential, Advanced and Premium to start; rename, add, reorder and remove tiers. Drag services into a tier's *Included* or *Add-ons* zone (mouse, touch or keyboard), or use the **+** menu. A side-by-side comparison matrix (✓ / Add-on / —) that you can click to edit. |
| **SLAs** | Per tier: coverage hours (8×5, 12×6, 24×7), P1–P4 response and resolution targets, and reporting cadence. Warns you when P1 isn't tighter than P4. |
| **Pricing** | Sizing inputs (endpoints, users, GB/day, contract months). Monthly and contract price per tier, a per-service cost breakdown, margin in currency, and price per endpoint. INR (with lakh/crore grouping) or USD. |
| **Coverage** | A NIST CSF 2.0 heatmap and radar for each tier, with gap call-outs such as "Advanced tier has no Recover coverage". |
| **Export** | A branded catalogue PDF (cover, tier comparison, a page per service, SLA table, optional pricing), a one-page tier comparison PDF, and JSON backup and restore. |
| **Settings** | MSSP name, logo and brand colour. The brand colour is used as the accent throughout the app and the PDFs. |
| **Catalogues** | The switcher at the top of the sidebar lets you create, switch, rename, duplicate and delete catalogues. Changes save automatically. |
| **Account** (`/app/account`) | Email address, sign out, set or change password, and delete the account |

**How pricing works:** service cost = unit cost × units, where units depend on the pricing unit:
- per endpoint: the number of endpoints
- per user: the number of users
- per GB-day: GB/day × 30
- flat monthly: 1

Tier price = the included services' total cost × (1 + margin %); margin is a markup on cost. Add-ons are priced separately with the tier's margin. Switching currency changes labels and number formatting only; unit costs are not converted.

## Routes

| Path | Who | Notes |
|------|-----|-------|
| `/` | everyone | Landing page |
| `/preview/{library,tiers,slas,pricing,coverage}` | everyone | Read-only demo; never reads or writes real data |
| `/sign-in`, `/sign-up`, `/forgot-password` | signed out | Signed-in visitors are sent to the app |
| `/reset-password` | via email link | Choose a new password |
| `/auth/confirm` | email links | Completes magic-link, sign-up confirmation and password-reset links |
| `/app/{library,tiers,slas,pricing,coverage,export,settings,account}` | signed in | Signed-out visitors go to `/sign-in?next=…` and come back afterwards |
| `/library` and the other old routes | | Permanent redirects to `/app/…` |

## Tech stack

Next.js 16 (App Router) and TypeScript · Tailwind CSS v4 with shadcn/ui (Radix) · Zustand · @dnd-kit · Recharts · @react-pdf/renderer · zod · Supabase (`@supabase/ssr`, `@supabase/supabase-js`) · Vitest

## Getting started

You need **Node.js 20.9 or later** (22 LTS recommended) and npm. The landing page and preview work without any setup. Signing in needs a Supabase project, either local or hosted.

```bash
git clone https://github.com/sundarrajbs/mssp-service-catalogue.git
cd mssp-service-catalogue
npm install
cp .env.example .env.local     # then fill in the values (next section)
npm run dev                    # http://localhost:3000
```

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server with hot reload |
| `npm test` | Unit tests: pricing, coverage, SLA rules, validation, repositories, auth helpers, CSP, and preview isolation |
| `npm run lint` | ESLint |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Serve the production build locally |

### Option A: local Supabase (no account needed)

Requires Docker. The repo includes `supabase/config.toml`, the email templates and the migration, so one command sets everything up:

```bash
npx supabase start
```

1. It prints an **API URL** and a **publishable key**. Put them in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Emails such as sign-in links go to a local inbox at <http://127.0.0.1:54324>, not to real addresses.
3. To stop the stack, run `npx supabase stop`.

### Option B: a hosted Supabase project

See [Supabase setup](#supabase-setup) below, then put the project's URL and anon key in `.env.local`.

## Environment variables

| Variable | Where | Required | What it is |
|----------|-------|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | local and Vercel | yes, for sign-in | The **project URL**, e.g. `https://abcd.supabase.co`, not the `…/rest/v1` endpoint (Supabase → Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | local and Vercel | yes, for sign-in | The **anon** or **publishable** key (same page). It's safe to be public: Row Level Security protects the data. |
| `NEXT_PUBLIC_SITE_URL` | Vercel (Production) | recommended | The site's public URL, e.g. `https://catalogue.example.com`, used in email links. Without it, the request's host is used. |
| `AUTH_RATE_LIMIT_PEPPER` | Vercel (all environments) | recommended | A long random secret (`openssl rand -hex 32`). It makes the app's rate-limit keys unguessable. Server-only: it has no `NEXT_PUBLIC_` prefix. |

**Never add the Supabase service-role key.** The app doesn't use it anywhere, not even on the server.

`NEXT_PUBLIC_*` values are built into the app, so **redeploy after changing them**.

## Supabase setup

1. **Create a project** at <https://supabase.com/dashboard>. Choose a region close to your users, for example Mumbai (ap-south-1) for India.
2. **Apply the database migration** (`supabase/migrations/20260926000000_catalogues.sql`). Either:
   - **SQL editor:** Dashboard → SQL Editor → New query, paste the whole file, and click **Run**. It's safe to run again.
   - **Supabase CLI:**
     ```bash
     npx supabase login
     npx supabase link --project-ref <your-project-ref>
     npx supabase db push
     ```

   The migration creates:
   - the `catalogues` table (`id`, `owner_id`, `name`, `data` jsonb, `created_at`, `updated_at`), with **Row Level Security** so a user can only select, insert, update or delete rows where `owner_id = auth.uid()`
   - `auth_rate_limit_hit()`, the app's own sign-in rate limiter, whose data is kept in a private schema the API can't reach
   - `delete_own_account()`, which lets a signed-in user delete only their own account and catalogues
3. **Authentication → Sign In / Providers:**
   - Enable the **Email** provider.
   - Keep **Confirm email** on.
   - Set the minimum password length to **10**, to match the app.
   - Leave every social provider off.
4. **Authentication → URL Configuration:**
   - **Site URL:** your production URL, e.g. `https://catalogue.example.com`.
   - **Redirect URLs:** add every place the app runs. Magic links and resets only go to URLs on this list:
     ```
     http://localhost:3000/**
     https://catalogue.example.com/**
     https://<project>-*-<team>.vercel.app/**
     ```
     The last line covers Vercel preview deployments; copy the pattern from one of your preview URLs.
5. **Authentication → Emails → Templates.** Replace the link in these four templates so links work even when opened on a different device from the one that asked for them. The ready-made versions are in `supabase/templates/`.

   | Template | Link |
   |----------|------|
   | Magic link | `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email` |
   | Confirm signup | `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email` |
   | Reset password | `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery` |
   | Change email address | `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email_change` |

   `{{ .RedirectTo }}` is the app's `/auth/confirm?next=…` address, so people land back on the page they wanted. With Supabase's default templates, links may only work in the browser that asked for them.
6. **Authentication → SMTP Settings.** Set up a custom SMTP provider (for example Amazon SES, Postmark, Resend or SendGrid) before real users sign up. Supabase's built-in email service is for testing only: it sends only to your team's addresses and is heavily rate-limited.

## Rate limits

Sign-in and sign-up are limited at two levels.

**1. Supabase's built-in limits**, which you can change in Dashboard → Authentication → Rate Limits. Typical defaults:

| Limit | Default |
|-------|---------|
| Sign-ups and sign-ins | 30 per 5 minutes per IP address |
| Magic-link and OTP verifications | 30 per 5 minutes per IP address |
| Session refreshes | 150 per 5 minutes per IP address |
| Emails sent | a small hourly cap with the built-in email service; configurable with custom SMTP |
| Repeat emails to the same address | at least 60 seconds apart (magic link, confirmation, reset) |

**2. The app's own limiter.** Session cookies are HTTP-only, so all auth calls run on the app's server, and Supabase sees every visitor as coming from Vercel's server IP. Its per-IP limits therefore can't tell visitors apart. The app adds per-visitor limits using the `auth_rate_limit_hit()` database function:
- **5 attempts per 15 minutes** for each visitor IP and email address, per action (sign-in, magic link, sign-up, reset)
- **30 attempts per 15 minutes** for each visitor IP, per action

Keys are SHA-256 hashes (with `AUTH_RATE_LIMIT_PEPPER`), so the database never stores IPs or emails. A blocked attempt sees "Too many attempts. Please wait a few minutes and try again." If the function is missing because the migration wasn't applied, the app logs an error and relies on Supabase's limits alone.

Later, CAPTCHA (hCaptcha or Cloudflare Turnstile) can be enabled in Dashboard → Authentication → Bot and Abuse Protection.

## Security model

- **Sessions:** `@supabase/ssr` keeps sessions in **HTTP-only, SameSite=Lax cookies**, marked Secure in production. All Supabase calls, both auth and data, run on the server in server actions, route handlers and the proxy. The browser never holds a token, and nothing is written to localStorage.
- **Route protection:**
  - `src/proxy.ts` (Next 16's replacement for middleware) refreshes the session and redirects signed-out requests for `/app/**` to sign-in.
  - The `/app` layout and every server action check the user again.
  - Redirects after sign-in only go to same-site paths (`safeNextPath`).
- **Data:** every catalogue query runs as the signed-in user, and **Row Level Security** limits it to rows where `owner_id = auth.uid()`. `owner_id` is set by the database, not the app. Catalogues are **validated with the zod schema before every save** (in the browser and again on the server) and when loaded.
- **No service-role key** anywhere. Account deletion uses a `SECURITY DEFINER` function that can only delete the caller.
- **Generic auth messages:** sign-in, magic link, sign-up and password reset never reveal whether an email has an account. Magic links only sign in existing accounts; new accounts go through sign-up.
- **Preview isolation:** the preview runs on an in-memory copy of a built-in demo catalogue. It never loads the repositories, the Supabase code or browser storage; a unit test checks this by walking the preview's imports. Every editing action in its store is a no-op.
- **Text:** React escapes all text; the app has no `dangerouslySetInnerHTML`. Free text is also stripped of control, bidirectional-override and zero-width characters.
- **Logos:** PNG, JPG or SVG, up to 500 KB, checked by content. They're redrawn to PNG on a canvas, which removes scripts from SVGs.
- **Imports:** JSON imports are checked against the zod schema, with cross-reference checks and a 5 MB limit.

| Header | Value |
|--------|-------|
| Content-Security-Policy | Scripts need a per-request nonce (`'strict-dynamic'`); `connect-src` allows only the site and your Supabase project; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` |
| X-Frame-Options | `DENY` |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | camera, microphone, geolocation, payment, USB and others disabled |
| X-Content-Type-Options | `nosniff` |
| Cross-Origin-Opener-Policy | `same-origin` |

Two deliberate CSP exceptions:
- `style-src 'unsafe-inline'`: the toast, Radix and chart libraries inject inline styles, and inline styles cannot run code.
- `'wasm-unsafe-eval'`: the PDF layout engine is WebAssembly. This allows compiling WebAssembly only, not JavaScript `eval`.

## Project structure

```
src/
  proxy.ts               CSP nonce, session refresh and /app guard (Next 16's "middleware")
  app/
    page.tsx             landing page
    preview/             read-only demo routes
    (auth)/              sign-in, sign-up, forgot/reset password, and their server actions
    auth/confirm/        email-link handler
    app/                 signed-in builder routes, account page, catalogue server actions
  components/
    marketing/           landing page
    preview/             preview banner, sign-in prompt, guarded buttons, demo store provider
    workspace/           catalogue switcher, autosave, import from this browser
    auth/ account/       auth forms and the account page
    layout/              builder shell, sidebar, tablet menu, theme
    library/ tiers/ slas/ pricing/ coverage/ export/ settings/
    ui/                  shadcn/ui components
  lib/
    domain/              zod schemas and types, pricing, coverage, SLA rules, validation  (+ tests)
    repository/          CatalogueRepository interface; Supabase and localStorage implementations
    supabase/            env, server client (HTTP-only cookies), proxy session refresh
    auth/                redirects, messages, validation, rate limiter
    seed/                starter services, default tiers, preview demo catalogue
    security/ logo/      CSP builder, logo checks
  store/                 Zustand store factory (one store per area, read-only mode for the preview)
supabase/
  config.toml            local development settings (npx supabase start)
  migrations/            SQL: catalogues table with RLS, rate limiter, account deletion
  templates/             auth emails with cross-device links
```

**Repository interface:** everything that stores catalogues implements `CatalogueRepository` (`list`, `load`, `save`, `rename`, `remove`):
- `SupabaseCatalogueRepository` runs on the server.
- The browser reaches it through `ServerActionRepository`, which has the same interface but calls server actions.
- `LocalStorageCatalogueRepository` finds catalogues saved by the earlier browser-only version. After sign-in, the app offers to import that catalogue into the account and then removes the local copy.

## Accessibility

- Every page works by keyboard, and a "Skip to main content" link is available.
- Drag-and-drop has a keyboard mode: focus a service, press Space, use the arrow keys to step between tier zones, then press Space to drop. There is also a **+** menu and clickable comparison cells.
- Form fields and icon buttons are labelled; the heatmap is a real table with text values, and gaps are marked with an icon and a label, not colour alone.
- The OS "reduce motion" setting is respected.
- The layout works down to iPad portrait (768 px), with a slide-out menu below 1024 px.
- The landing page, preview, auth pages and builder pass an automated axe-core audit.

## Deploying to Vercel from GitHub

1. **Set up Supabase first.** Follow [Supabase setup](#supabase-setup) and note the project URL (just `https://<ref>.supabase.co`, without `/rest/v1`) and the anon key.
2. **Create the Vercel project.** Sign in at <https://vercel.com> with GitHub, choose **Add New… → Project**, and import `mssp-service-catalogue`. If it isn't listed, use **Adjust GitHub App Permissions**. Vercel detects **Next.js**; leave the build settings at their defaults.
3. **Add environment variables** before the first deploy, under **Environment Variables** (or later in Project → Settings → Environment Variables):

   | Name | Environments |
   |------|--------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview (and Development if you use `vercel dev`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview |
   | `AUTH_RATE_LIMIT_PEPPER` | Production, Preview |
   | `NEXT_PUBLIC_SITE_URL` | Production only (your final URL) |

   You can use a separate Supabase project for Preview deployments by setting different values for the Preview environment.
4. **Deploy.** Every push to `main` then deploys production, and every pull request gets a preview URL.
5. **Finish the Supabase settings.** In Authentication → URL Configuration, set the **Site URL** to the production URL and add the production and preview URL patterns to **Redirect URLs** (step 4 of Supabase setup).
6. **Custom domain (optional).** Go to Project → Settings → Domains. Then update `NEXT_PUBLIC_SITE_URL`, the Supabase Site URL and the redirect list, and redeploy.
7. **Check it:**
   - `curl -sI https://<your-url>/app/library` should return a redirect to `/sign-in?next=…`, along with the security headers.
   - Sign up with a real address, confirm the email, and check that you land in the builder.
   - In Supabase → Table Editor → `catalogues`, the new row appears with your user ID as `owner_id`.

## Licences

- Inter font: © The Inter Project Authors, SIL Open Font License 1.1 (`public/fonts/OFL-Inter.txt`).
- Starter and demo service content is generic and vendor-neutral, and you're free to adapt it. "Sentinel Shield Managed Services" is fictional.
- Project licence: MIT (see `LICENSE`).
