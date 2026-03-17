# Venue URL Routing Design

**Date:** 2026-03-17
**Status:** Approved

## Overview

Replace query-param-based routing (`?venue=<uuid>&mode=staff`) with clean path-based URLs on a dedicated subdomain. Kiosk tablets and staff browsers get human-readable, bookmarkable URLs.

**Target URL structure:**
```
app.jarv-id.com/                        → Login/dispatch screen (behaviour varies by auth state)
app.jarv-id.com/:venueSlug/kiosk        → Kiosk view (public, PIN-gated)
app.jarv-id.com/:venueSlug/staff        → Staff dashboard (Supabase auth required)
app.jarv-id.com/<unknown>               → "Venue not found" screen
```

## 1. URL Structure & Routes

Four routes defined with React Router v6:

| Path | Component | Auth |
|------|-----------|------|
| `/` | `<RootPage>` | Conditional (see §3) |
| `/:venueSlug/kiosk` | `<KioskRoute>` | Public (no session), existing PIN challenge |
| `/:venueSlug/staff` | `<StaffRoute>` | Supabase session required |
| `*` | `<VenueNotFound>` | None |

### `useVenue(slug)` hook

```ts
type UseVenueResult = {
  venueId: string | null   // UUID once resolved, null while loading or not found
  loading: boolean
  notFound: boolean
}
```

Called only in `<KioskRoute>` and `<StaffRoute>` — not in `<RootPage>` (which has no slug in its URL). Fetches `SELECT id FROM venues WHERE slug = :slug LIMIT 1` via the Supabase client.

**RLS requirement — public read (id + slug):** the `venues` table must have an RLS policy allowing unauthenticated (anon) clients to `SELECT id, slug`. This is required because `/:venueSlug/kiosk` is unauthenticated and uses `useVenue` to resolve the slug. All other columns remain protected by existing RLS rules. RLS policies for other tables queried by the kiosk (products, orders, etc.) are unchanged — this routing change does not alter how the kiosk client authenticates those queries.

While `loading` → spinner. On `notFound` → `<VenueNotFound>`.

## 2. Data Model

### Migration (ordered steps)

```sql
-- Step 1: add column if not already present (idempotent)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS slug text;

-- Step 2: bulk backfill
UPDATE venues
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Step 3: resolve backfill collisions via PL/pgSQL DO block
-- For any duplicate slug, append -2, -3, ... until unique.
-- Ordering within each duplicate group is arbitrary — any assignment
-- producing unique slugs is correct. One row keeps the base slug;
-- others receive {base}-2, {base}-3, etc.

-- Step 4: enforce constraints
ALTER TABLE venues ALTER COLUMN slug SET NOT NULL;
ALTER TABLE venues ADD CONSTRAINT IF NOT EXISTS venues_slug_key UNIQUE (slug);

-- Step 5: RLS — anon can read id + slug (for slug resolution on kiosk route)
-- Example (adjust to match your existing RLS setup):
-- CREATE POLICY "public_slug_lookup" ON venues
--   FOR SELECT TO anon USING (true);
-- Or a column-level grant if your RLS is more granular.

-- Step 6: RLS — authenticated super-admins can read name + slug for all venues
-- (required for VenuePicker). If an existing authenticated-user policy
-- already grants SELECT on all rows, no new policy is needed.
-- Otherwise add:
-- CREATE POLICY "super_admin_read_all_venues" ON venues
--   FOR SELECT TO authenticated
--   USING (auth.jwt() ->> 'role' = 'super_admin' OR true);
-- (adjust to match your role-checking convention)
```

### INSERT trigger (new venues)

Created **after step 4 of the migration** so the UNIQUE constraint is always the final safety net.

`BEFORE INSERT` trigger on `venues`:

1. If `NEW.slug` is already non-null (admin manually provided one), skip auto-generation — go directly to step 5. The DB UNIQUE constraint enforces uniqueness; no special handling in the trigger.
2. Compute base: `lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'))`
3. Candidate = base
4. Loop: `SELECT 1 FROM venues WHERE slug = candidate` — if free, break; else try `{base}-2`, `{base}-3`, … up to `-99`; raise exception if still no free slot after 99 attempts
5. Set `NEW.slug = candidate`

### Admin UI

New "URL Slug" text field in the existing venue settings panel (App.jsx ~line 4353):
- Displayed as: `app.jarv-id.com/[slug]/kiosk`
- Client-side validation: `^[a-z0-9-]+$`, non-empty, shown inline before save
- On save: `supabase.from("venues").update({ slug })` — if Postgres returns a unique constraint violation, show an error toast: "This slug is already taken — choose a different one"
- No client-side pre-check for uniqueness (DB is authoritative; race conditions possible otherwise)

## 3. RootPage — Conditional Rendering

`<RootPage>` checks auth state on mount and renders one of four states:

| Condition | Renders |
|-----------|---------|
| Auth check in progress | Loading spinner |
| Not authenticated | Login form (existing auth UI) |
| Authenticated, `role !== 'super_admin'` and `venue_id` set | Redirect to `/{slug}/staff` |
| Authenticated, `role === 'super_admin'` or `venue_id IS NULL` | `<VenuePicker>` |

**Slug resolution for normal-staff redirect:** RootPage does not use `useVenue` (no slug in the URL). Instead it runs `SELECT slug FROM venues WHERE id = user.venue_id LIMIT 1` directly, then `navigate(\`/${slug}/staff\`)`.

### `<VenuePicker>`

Fetches `SELECT name, slug FROM venues ORDER BY name` (authenticated request — super-admin has read access to all rows per the RLS policy in §2). Renders a list of venue names, each as a React Router `<Link to="/:venueSlug/staff">`. No other state required.

### `?next=` redirect for unauthenticated `/staff` access

1. `<StaffRoute>` detects no session → `navigate(\`/?next=${encodeURIComponent(location.pathname)}\`, { replace: true })`
2. `<RootPage>` after successful login reads `new URLSearchParams(location.search).get('next')`
3. Validation: `next` must start with `/` and must not contain `://`. If invalid → silently discard and use default redirect
4. **Normal staff** (role !== super_admin, venue_id set): `navigate(validNext ?? \`/${slug}/staff\`)`
5. **Super-admin** (role === super_admin or venue_id IS NULL): `?next=` is ignored — super-admins always land on `<VenuePicker>` and choose their destination from there

### Kiosk access

`/:venueSlug/kiosk` is fully public — no Supabase session check. The existing PIN challenge (5-tap logo unlock + `kiosk_pin` from the database) remains unchanged.

### Page refresh

On refresh, `useVenue` re-fetches slug → venueId. Auth state re-checked by existing `supabase.auth.getSession()`. No redirect if already on a valid, matching route.

## 4. App.jsx Refactor

### Routing library

**React Router v6** (`react-router-dom`) — wraps app in `<BrowserRouter>`.

### Component structure

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/"                  element={<RootPage />} />
    <Route path="/:venueSlug/kiosk"  element={<KioskRoute />} />
    <Route path="/:venueSlug/staff"  element={<StaffRoute />} />
    <Route path="*"                  element={<VenueNotFound />} />
  </Routes>
</BrowserRouter>
```

**New components (extracted from existing App() logic, no behaviour changes to children):**
- `<RootPage>` — auth check → login form, `<VenuePicker>`, or redirect
- `<VenuePicker>` — venue list for super-admins (links to `/:venueSlug/staff`)
- `<KioskRoute>` — calls `useVenue(slug)`, renders `<KioskView venueId={...} />`
- `<StaffRoute>` — calls `useVenue(slug)`, guards auth (redirects with `?next=`), renders staff dashboard
- `<VenueNotFound>` — simple "Venue not found" error screen
- `useVenue(slug)` — shared hook: Supabase query slug → `UseVenueResult`

**Removed:**
- `activeTab` / `?venue=` / `?mode=staff` query param logic
- Hardcoded fallback venue UUID (`498c51cc-...`) in `loadPin` effect

**Unchanged:**
- All existing child components (`KioskView`, `KioskBrowse`, `KioskPaymentInner`, staff dashboard, etc.) — continue to receive `venueId` as a prop

App.jsx remains a single file.

## 5. Vercel / Infrastructure

- Deploy main app as a new Vercel project linked to **repo root** (not the `landing/` subdirectory)
- Add `app.jarv-id.com` as a custom domain in the Vercel dashboard
- Add DNS CNAME: `app → cname.vercel-dns.com`
- Vercel auto-provisions SSL cert
- Add `vercel.json` at **repo root**:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
  All backend traffic goes directly to Supabase (edge functions at a separate Supabase URL) — no server-side handlers exist on this Vercel project. The catch-all rewrite is intentional. Any future API routes on this project must be listed as explicit entries **before** this rewrite rule.

## Out of Scope

- Splitting App.jsx into multiple files
- Supporting legacy `?venue=<uuid>` URLs with redirects (pre-launch, not needed)
- Per-venue custom domains (e.g. `crown.jarv-id.com`)
