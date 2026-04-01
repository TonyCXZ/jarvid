# Device Fixed Routes — Design Spec
_Date: 2026-04-01_

## Goal

Replace the venue-slug-in-URL pattern with fixed routes + device-stored venue config, so Hexnode only ever needs 2 kiosk profiles regardless of how many venues exist.

- Kiosk tablets: `app.jarv-id.com/kiosk?venue=VENUE_SLUG`
- Staff tablets: `app.jarv-id.com/staff?venue=VENUE_SLUG`

Existing `/:venueSlug/kiosk` and `/:venueSlug/staff` routes remain untouched for direct browser access.

---

## Data Layer

### New `setup_code` column on `venues`

```sql
ALTER TABLE venues
  ADD COLUMN setup_code TEXT
  CHECK (setup_code ~ '^\d{6}$');

CREATE UNIQUE INDEX venues_setup_code_unique ON venues (setup_code)
  WHERE setup_code IS NOT NULL;
```

- 6-digit numeric string
- Nullable — existing rows default to NULL until set by super admin
- Unique across all venues
- Super admin sets/regenerates via the admin portal venue detail view

### localStorage key: `jarv-id:venue-config`

Stores a JSON object:

```json
{
  "venueId": "<uuid>",
  "venueSlug": "<slug>",
  "venueLabel": "<display name>"
}
```

Label is cached so the device can display the configured venue name without a network call on every boot. No boot-time re-validation — localStorage is trusted as-is.

---

## Venue Resolution: `useVenueFromDevice()`

A new hook that replaces `useVenue(slug)` for the two new device routes. Runs this waterfall on mount:

```
1. Check localStorage["jarv-id:venue-config"]
   → found: return { venueId, venueSlug, venueLabel, provisioning: false }

2. Check URL ?venue=SLUG param
   → found: query Supabase for id + name by slug
     → valid:   write to localStorage → return { provisioning: false }
     → invalid: fall through to step 3

3. Return { provisioning: true }
   → caller renders <VenueSetup onComplete={fn} />
```

Returns: `{ venueId, venueSlug, venueLabel, loading, provisioning, reprovision }`

`reprovision` is a function that clears localStorage and re-runs the waterfall (used by the escape hatch).

---

## `VenueSetup` Component

Full-screen provisioning UI, warm noir style (uses existing DS object).

- Renders a 6-digit numeric code entry screen
- On submit: `SELECT id, slug, name FROM venues WHERE setup_code = $1`
  - Success → write `jarv-id:venue-config` to localStorage → call `onComplete()`
  - Failure → inline error "Invalid code. Check with your administrator."
- No retries, no timeouts — keep it simple
- Shows current provisioning state ("Configured: The Crown Pub") if device is already set up (should not normally appear, but defensive)

---

## `useReprovisionEscape(setupCode)` Hook

Takes the venue's `setup_code` string (loaded from Supabase once `venueId` is known, same query that loads `kiosk_pin`).

Behaviour:
- Tracks logo tap count; resets after 2 seconds of no taps
- After 5 taps: shows a full-screen 6-digit PIN overlay
- Correct entry (matches `setup_code`) → calls `reprovision()` from `useVenueFromDevice`, returning device to `VenueSetup`
- Wrong entry → shake animation + "Invalid code" error → reset input
- Returns: `{ escapeActive, escapeEntry, handleEscapeTap, handleEscapeKey }`

---

## New Routes

### `KioskRouteDevice` → `/kiosk`

```
useVenueFromDevice()
  → provisioning: true  → <VenueSetup onComplete={reprovision} />
  → provisioning: false → load kiosk_pin + setup_code from venues
                        → useReprovisionEscape(setupCode)
                        → <KioskView venueId={venueId} />  ← unchanged
```

- 5-tap escape target: the logo tap handler (already exists in `KioskRoute`)
- Escape hatch overlay replaces the existing staff-PIN overlay when active

### `StaffRouteDevice` → `/staff`

```
useVenueFromDevice()
  → provisioning: true  → <VenueSetup onComplete={reprovision} />
  → provisioning: false → load setup_code + kiosk_pin from venues (same single query as KioskRouteDevice)
                        → useReprovisionEscape(setupCode)
                        → <StaffView venueId={venueId} kioskoidMode={true} kioskPin={kioskPin} />  ← unchanged, no auth
```

- 5-tap escape target: the "STAFF ORDERS" heading (`onClick` already present when `kioskoidMode={true}`)
- No Supabase auth — kioskoid mode only

### Route Registration (in `App()`)

New routes added **before** the existing slug routes to prevent collision:

```jsx
<Route path="/kiosk"  element={<KioskRouteDevice />} />
<Route path="/staff"  element={<StaffRouteDevice />} />
<Route path="/:venueSlug/kiosk"             element={<KioskRoute />} />
<Route path="/:venueSlug/kiosk/:kioskSlug"  element={<KioskRoute />} />
<Route path="/:venueSlug/staff"             element={<StaffRoute />} />
```

---

## Admin Portal: Setup Code Management

In the existing super admin venue detail view, add a **"Setup Code"** section:

- Displays current `setup_code` masked as `••••••` with a reveal toggle
- **"Regenerate"** button — generates a new random 6-digit code, writes to Supabase, shows confirmation toast
- Editable text input as manual fallback (numeric only, 6 digits, validated before save)
- Save and Regenerate are separate actions — Regenerate is one-click, edit requires explicit Save
- No bulk generation, no CSV export

---

## Migration

```sql
-- 20260401000000_add_venue_setup_code.sql
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS setup_code TEXT
  CHECK (setup_code ~ '^\d{6}$');

CREATE UNIQUE INDEX IF NOT EXISTS venues_setup_code_unique
  ON venues (setup_code)
  WHERE setup_code IS NOT NULL;
```

No backfill — existing venues start with NULL and get a code assigned by the super admin as needed.

---

## Out of Scope

- Offline-first / service worker changes
- Kiosk-slug (`/kiosk/:kioskSlug`) variant for the new device routes
- Bulk setup code generation or import
- Boot-time re-validation of stored venue config
