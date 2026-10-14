# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev            # http://localhost:3000
npm test               # vitest run (all src/**/*.test.ts)
npx vitest run src/lib/domain/pricing.test.ts   # single file
npx vitest run -t "name of test"                # single test by name
npm run lint           # eslint
npm run build          # production build; this is also the type-check
npx supabase start     # local Supabase (Docker); prints URL + publishable key for .env.local
```

The app runs without Supabase env vars: guests use the builder with localStorage, and sign-in is simply hidden (`isSupabaseConfigured()`). Requires Node ≥ 20.9.

## What this is

A Next.js 16 (App Router) app for MSSPs to build a managed-security service catalogue: a service library, tiers (included/add-on services), per-tier SLAs, pricing, NIST CSF 2.0 coverage, and PDF/JSON export. `README.md` documents features, routes, pricing formulas, Supabase setup and the security model in detail — read it before changing auth, storage or headers.

Next 16 specifics: `src/proxy.ts` is the middleware (renamed in Next 16). Check `node_modules/next/dist/docs/` before using Next APIs.

## Architecture

**One data model, three hosts.** The whole user document is a single `Catalogue` object defined by the zod schema in `src/lib/domain/schema.ts` (types are inferred in `types.ts`; `schemaVersion` is a literal, so changing the shape means bumping `CATALOGUE_SCHEMA_VERSION` and handling old data). The same builder pages/components run in three contexts, each of which creates its own Zustand store via `createCatalogueStore()` (`src/store/catalogueStore.ts`) and provides it with `CatalogueStoreProvider`:

| Host | Where | Storage |
|------|-------|---------|
| `GuestWorkspace` | `/app` when signed out | `LocalStorageCatalogueRepository`, debounced autosave |
| `CatalogueWorkspace` | `/app` when signed in | `ServerActionRepository` → server actions in `src/app/app/catalogue-actions.ts` → `SupabaseCatalogueRepository`; multi-catalogue switcher, debounced autosave |
| `PreviewProvider` | `/preview` | in-memory demo catalogue, `readOnly: true` |

`src/app/app/layout.tsx` chooses guest vs. signed-in on the server. The store itself never persists anything — the owning workspace subscribes and saves. Components must not reach for a repository directly; they use the store (and `useWorkspace()` for catalogue-level operations).

**Routing between areas:** components shared by `/app` and `/preview` build links with `useBuilderHref()` (`BuilderContext`) rather than hard-coding `/app/...`. Mutating UI in the preview should use `GuardedButton`/`SignInPrompt` from `components/preview/`.

**Preview isolation is enforced by a test.** `src/app/preview/isolation.test.ts` walks every import reachable from `src/app/preview/**` and fails if it reaches repositories, Supabase, catalogue server actions or browser storage. When editing a component used by both areas, don't import those modules into it — pass behaviour in from the host instead. In read-only mode all mutating store actions are no-ops except sizing/currency.

**Repository contract:** `CatalogueRepository` (`list`, `load`, `save`, `rename`, `remove`) in `src/lib/repository/`. Implementations validate with zod on save and load and throw `CatalogueValidationError` with `problems`. Server actions return `ActionResult<T>` (`{ok:true,data}` / `{ok:false,error}`), with `error: "signed-out"` as a sentinel the client turns into `SignedOutError`.

**Domain logic is pure** in `src/lib/domain/` (pricing, coverage, SLA rules, import/export validation) and is where the unit tests live. UI should compute derived values through these functions rather than re-implementing them.

**Sanitising:** store actions run free text through `cleanText`/`sanitizeService`/`sanitizeCatalogue` (`src/lib/sanitize.ts`). New text fields on the catalogue need the same treatment.

**Security constraints to preserve** (details in README "Security model"):
- All Supabase calls run on the server (server actions, route handlers, proxy) with HTTP-only cookies; never use Supabase from client components and never add a service-role key.
- Every server action re-checks `auth.getUser()`; RLS (`supabase/migrations/`) limits rows to `owner_id = auth.uid()`.
- CSP is nonce-based and built per request in `src/lib/security/csp.ts` (tested); static headers are in `next.config.ts`. No `dangerouslySetInnerHTML`. New third-party origins need CSP changes.
- Post-auth redirects go through `safeNextPath` (`src/lib/auth/redirect.ts`). Auth messages must not reveal whether an email exists.
- `@react-pdf/renderer` is dynamically imported in `components/export/pdf/generate.tsx` to keep it out of the main bundle; keep it that way.

UI uses shadcn/ui (`src/components/ui/`, configured in `components.json`) on Tailwind v4; the user's brand colour is applied as the accent via `BrandAccent`. Path alias `@/` → `src/`.
