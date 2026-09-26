# MSSP Catalogue Builder

A web app for Managed Security Service Providers (MSSPs) to **design, tier, price and export** their managed security service catalogue. It is built for live partner workshops: one person drives the app on a projector or iPad while the MSSP team gives input, and at the end the team leaves with a branded PDF catalogue.

All data stays in the browser. There are no accounts and no backend. Work is backed up and shared by exporting and importing JSON.

## Features

| Page | What it does |
|------|--------------|
| **Library** | 15 editable, vendor-neutral starter services (monitoring, MDR, threat hunting, IR retainer, compliance reporting including RBI, SEBI CSCRF and DPDP Act, and more). Search, filter by category, and add, edit, duplicate or delete in a side sheet. |
| **Tiers** | Essential, Advanced and Premium to start; rename, add, reorder and remove tiers. Drag services into a tier's *Included* or *Add-ons* zone (mouse, touch or keyboard), or use the **+** menu. A side-by-side comparison matrix (✓ / Add-on / —) that you can click to edit. |
| **SLAs** | Per tier: coverage hours (8×5, 12×6, 24×7), P1–P4 response and resolution targets, and reporting cadence. Warns you when P1 isn't tighter than P4. |
| **Pricing** | Sizing inputs (endpoints, users, GB/day, contract months). Monthly and contract price per tier, a per-service cost breakdown, margin in currency, and price per endpoint. INR (with lakh/crore grouping) or USD. |
| **Coverage** | A NIST CSF 2.0 heatmap and radar for each tier, with gap call-outs such as "Advanced tier has no Recover coverage". |
| **Export** | A branded catalogue PDF (cover, tier comparison, a page per service, SLA table, optional pricing), a one-page tier comparison PDF, and JSON backup and restore. |
| **Settings** | MSSP name, logo and brand colour. The brand colour is used as the accent throughout the app and the PDFs. |

**How pricing works:** service cost = unit cost × units, where units depend on the pricing unit:
- per endpoint: the number of endpoints
- per user: the number of users
- per GB-day: GB/day × 30
- flat monthly: 1

Tier price = the included services' total cost × (1 + margin %); margin is a markup on cost. Add-ons are priced separately with the tier's margin. Switching currency changes labels and number formatting only; unit costs are not converted.

## Tech stack

Next.js 16 (App Router) and TypeScript · Tailwind CSS v4 with shadcn/ui (Radix) · Zustand (persisted through a repository) · @dnd-kit · Recharts · @react-pdf/renderer · zod · Vitest

## Getting started

You need **Node.js 20.9 or later** (22 LTS recommended) and npm.

```bash
git clone https://github.com/sundarrajbs/mssp-service-catalogue.git
cd mssp-service-catalogue
npm install
npm run dev          # http://localhost:3000
```

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server with hot reload |
| `npm test` | Unit tests (pricing, coverage, SLA rules, import validation, sanitising, CSP) |
| `npm run lint` | ESLint |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Serve the production build locally |

No environment variables are needed.

## Project structure

```
src/
  app/                 routes: library, tiers, slas, pricing, coverage, export, settings
  proxy.ts             per-request Content-Security-Policy (Next 16's replacement for middleware)
  components/
    ui/                shadcn/ui components
    layout/            sidebar, tablet menu, theme, brand accent
    library/ tiers/ slas/ pricing/ coverage/ export/ settings/
    export/pdf/        react-pdf documents (catalogue, one-pager)
  lib/
    domain/            zod schemas and types, pricing, coverage, SLA rules, import/export  (+ *.test.ts)
    seed/              starter services and default tiers
    repository/        CatalogueRepository interface + localStorage implementation
    security/          CSP builder
    logo/              logo validation and conversion
    sanitize.ts        text sanitising
  store/               Zustand store (all edits go through its actions)
public/fonts/          Inter font subsets for PDFs (SIL Open Font License)
```

### Adding a database and sign-in later

The UI never touches storage directly. The store persists through the `CatalogueRepository` interface in `src/lib/repository/CatalogueRepository.ts`:

```ts
interface CatalogueRepository {
  load(): Promise<Catalogue | null>;
  save(catalogue: Catalogue): Promise<void>;
  clear(): Promise<void>;
}
```

To move to Supabase or Postgres:
1. Implement this interface, for example as a `SupabaseCatalogueRepository` that saves the catalogue JSON in a `catalogues` table keyed by user or organisation.
2. Swap it in at `src/lib/repository/index.ts`.
3. Validate data with the existing `catalogueSchema` on the server.
4. Add auth (for example Supabase Auth or Auth.js) and protect routes in `src/proxy.ts`.

The schema carries a `schemaVersion`, so stored data can be migrated safely.

## Data, privacy and security

- **Storage:** the catalogue is saved in the browser's `localStorage` on the device in use. Clearing browser data deletes it, so **export JSON regularly** (Export → Export JSON) and to hand work over between devices.
- **Imports:** checked against the zod schema, with cross-reference checks and a 5 MB limit. Malformed files are rejected with an explanation, and nothing is changed.
- **Text:** React escapes all text; the app has no `dangerouslySetInnerHTML`. Free text is also stripped of control, bidirectional-override and zero-width characters before it is stored or put into a PDF.
- **Logos:** PNG, JPG or SVG only, up to 500 KB. The file's content is checked, not just its name, and the image is redrawn to PNG on a canvas. That removes any scripts from SVGs and strips metadata.
- **Security headers:** set in `next.config.ts` and `src/proxy.ts`.

| Header | Value |
|--------|-------|
| Content-Security-Policy | Scripts need a per-request nonce (`'strict-dynamic'`); no third-party origins; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` |
| X-Frame-Options | `DENY` |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | camera, microphone, geolocation, payment, USB and others disabled |
| X-Content-Type-Options | `nosniff` |
| Cross-Origin-Opener-Policy | `same-origin` |

Two deliberate CSP exceptions:
- `style-src 'unsafe-inline'`: the toast, Radix and chart libraries inject inline styles, and inline styles cannot run code.
- `'wasm-unsafe-eval'`: the PDF layout engine is WebAssembly. This allows compiling WebAssembly only, not JavaScript `eval`.

Because the CSP uses a nonce, pages are rendered per request rather than pre-built.

## Accessibility

- Every page works by keyboard, and a "Skip to main content" link is available.
- Drag-and-drop has a keyboard mode: focus a service, press Space, use the arrow keys to step between tier zones, then press Space to drop. There is also a **+** menu and clickable comparison cells.
- Form fields and icon buttons are labelled; the heatmap is a real table with text values, and gaps are marked with an icon and a label, not colour alone.
- The OS "reduce motion" setting is respected.
- The layout works down to iPad portrait (768 px), with a slide-out menu below 1024 px.
- Every page passes an automated axe-core audit in light and dark mode.

## Deploying to Vercel from GitHub

The app needs no configuration on Vercel.

1. **Push the code to GitHub.** It's already there if you're reading this in the repository.
2. **Create the project.** Sign in at <https://vercel.com> with your GitHub account, then choose **Add New… → Project**.
3. **Import the repository.** Find `mssp-service-catalogue` and click **Import**. If it isn't listed, choose **Adjust GitHub App Permissions** and give Vercel access to the repository.
4. **Check the settings.** Vercel detects **Next.js** automatically. Leave the build command (`next build`), output directory and install command at their defaults. No environment variables are needed.
5. **Deploy.** Click **Deploy**. After about a minute you get a URL like `https://mssp-service-catalogue.vercel.app`.
6. **Automatic deploys.**
   - Every push to `main` redeploys production.
   - Every pull request gets its own preview URL, which is handy for reviewing changes before a workshop.
7. **Custom domain (optional).** Go to **Project → Settings → Domains**, add a domain such as `catalogue.example.com`, and create the DNS record Vercel shows you. HTTPS is set up automatically.
8. **Check the security headers.** Open the site, then DevTools → Network → select the page request → Response Headers, or run:
   ```bash
   curl -sI https://<your-deployment>.vercel.app/library
   ```
   You should see `content-security-policy`, `strict-transport-security`, `x-frame-options: DENY` and the other headers listed above.

> **Workshop tip:** each browser keeps its own copy of the data. Before a workshop, open the deployed site on the presenting laptop or iPad, set the MSSP's name, logo and colour, and afterwards export both the PDF and the JSON backup.

## Licences

- Inter font: © The Inter Project Authors, SIL Open Font License 1.1 (`public/fonts/OFL-Inter.txt`).
- Starter service content is generic and vendor-neutral, and you're free to adapt it.
- Project licence: MIT (see `LICENSE`).
