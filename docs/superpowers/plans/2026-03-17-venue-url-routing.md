# Venue URL Routing Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `?venue=uuid&mode=staff` query params with path-based URLs at `app.jarv-id.com/:venueSlug/kiosk` and `app.jarv-id.com/:venueSlug/staff`.

**Architecture:** Add React Router v6 to the existing Vite/React SPA. Extract route-specific logic from the monolithic `App()` into focused route components (`RootPage`, `KioskRoute`, `StaffRoute`). Add a `slug` column to `venues` via a Supabase migration with auto-generation trigger.

**Tech Stack:** React Router v6 (`react-router-dom`), Supabase (existing), Vite (existing), Vercel (new project at repo root).

> **Note:** No test framework exists in this project. All verification steps are manual browser checks.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260317000001_add_venue_slug.sql` | Create | Adds `slug` column, backfills, adds constraints + INSERT trigger |
| `src/App.jsx` | Modify | Add router, new route components, hook; replace `App()` |
| `vercel.json` | Create | SPA catch-all rewrite for Vercel |

---

## Task 1: Install react-router-dom

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install the package**

```bash
cd /Users/tony/jarvid && npm install react-router-dom
```

Expected output: `added X packages` with no errors.

- [ ] **Step 2: Verify it appears in dependencies**

```bash
grep react-router-dom package.json
```

Expected: `"react-router-dom": "^6.x.x"`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add react-router-dom"
```

---

## Task 2: Create the Supabase migration

**Files:**
- Create: `supabase/migrations/20260317000001_add_venue_slug.sql`

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/20260317000001_add_venue_slug.sql` with this content:

```sql
-- Step 1: Add slug column (idempotent)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS slug text;

-- Step 2: Bulk backfill from name
UPDATE venues
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Step 3: Resolve any backfill collisions
-- One row per duplicate group keeps the base slug (arbitrary);
-- others receive {base}-2, {base}-3, etc.
DO $$
DECLARE
  dup_slug text;
  venue_row RECORD;
  counter int;
  candidate text;
BEGIN
  FOR dup_slug IN
    SELECT slug FROM venues GROUP BY slug HAVING count(*) > 1
  LOOP
    counter := 2;
    FOR venue_row IN
      SELECT id FROM venues WHERE slug = dup_slug ORDER BY id OFFSET 1
    LOOP
      candidate := dup_slug || '-' || counter;
      WHILE EXISTS (
        SELECT 1 FROM venues WHERE slug = candidate AND id != venue_row.id
      ) LOOP
        counter := counter + 1;
        candidate := dup_slug || '-' || counter;
      END LOOP;
      UPDATE venues SET slug = candidate WHERE id = venue_row.id;
      counter := counter + 1;
    END LOOP;
  END LOOP;
END;
$$;

-- Step 4: Enforce NOT NULL + UNIQUE
ALTER TABLE venues ALTER COLUMN slug SET NOT NULL;
ALTER TABLE venues ADD CONSTRAINT IF NOT EXISTS venues_slug_key UNIQUE (slug);

-- Step 5: INSERT trigger for auto-slug on new venues
-- Created AFTER the UNIQUE constraint so the constraint is always the safety net.
CREATE OR REPLACE FUNCTION set_venue_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  candidate text;
  counter int := 2;
BEGIN
  -- If slug already provided manually, skip auto-generation
  IF NEW.slug IS NOT NULL THEN
    RETURN NEW;
  END IF;

  base_slug := trim(both '-' from
    lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'))
  );
  candidate := base_slug;

  LOOP
    IF NOT EXISTS (SELECT 1 FROM venues WHERE slug = candidate) THEN
      NEW.slug := candidate;
      RETURN NEW;
    END IF;
    IF counter > 99 THEN
      RAISE EXCEPTION 'Could not generate unique slug for venue: %', NEW.name;
    END IF;
    candidate := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS venue_slug_trigger ON venues;
CREATE TRIGGER venue_slug_trigger
  BEFORE INSERT ON venues
  FOR EACH ROW EXECUTE FUNCTION set_venue_slug();

-- Step 6: RLS — anon clients can read id + slug (needed for unauthenticated kiosk route)
-- Skip if a permissive SELECT policy already exists for anon on venues.
-- Adjust policy name/condition to match your existing RLS conventions.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'venues' AND policyname = 'public_slug_lookup'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY public_slug_lookup ON venues
        FOR SELECT TO anon USING (true)
    $policy$;
  END IF;
END;
$$;

-- Step 7: Ensure authenticated users can read name + slug for VenuePicker
-- Skip if an authenticated-user SELECT policy already exists.
-- The existing RLS setup may already cover this — check before running.
```

- [ ] **Step 2: Run the migration in Supabase**

**Option A — Supabase dashboard (simplest):** Open the Supabase dashboard → SQL Editor, paste the full migration SQL, and run it.

**Option B — Supabase CLI:**
First verify the project is linked:
```bash
supabase status
```
If not linked: `supabase link --project-ref <your-project-ref>`. Then:
```bash
supabase db push
```

- [ ] **Step 3: Verify slugs were backfilled**

In the Supabase SQL Editor:
```sql
SELECT id, name, slug FROM venues ORDER BY name;
```

Expected: every row has a non-null unique slug (e.g. "The Crown Pub" → `the-crown-pub`).

- [ ] **Step 4: Verify RLS allows anon slug lookup**

In the Supabase SQL Editor (switch to anon role if possible, or test via the app):
```sql
-- Run as anon role
SELECT id, slug FROM venues LIMIT 5;
```

Expected: rows returned without error.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260317000001_add_venue_slug.sql
git commit -m "feat: add venues.slug column with backfill and insert trigger"
```

---

## Task 3: Add `useVenue` hook and `VenueNotFound` component to App.jsx

**Files:**
- Modify: `src/App.jsx` (add near top of file, after imports, before `GlobalStyles`)

- [ ] **Step 1: Add the react-router-dom import at the top of App.jsx**

In `src/App.jsx`, find the existing imports at the top (around lines 1–10). Add this line after the existing imports:

```js
import { BrowserRouter, Routes, Route, useParams, useNavigate, useLocation, Link } from "react-router-dom";
```

- [ ] **Step 2: Add `useVenue` hook after the imports block (before `GlobalStyles` at line ~108)**

Insert this code block:

```jsx
// ─── useVenue hook ───────────────────────────────────────────────────────────
// Resolves a URL slug to a venue UUID. Used by KioskRoute and StaffRoute.
function useVenue(slug) {
  const [venueId, setVenueId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setLoading(false); setNotFound(true); return; }
    setLoading(true);
    setNotFound(false);
    supabase.from("venues").select("id").eq("slug", slug).single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else { setVenueId(data.id); }
        setLoading(false);
      });
  }, [slug]);

  return { venueId, loading, notFound };
}
```

- [ ] **Step 3: Add `VenueNotFound` component immediately after `useVenue`**

```jsx
// ─── VenueNotFound ────────────────────────────────────────────────────────────
function VenueNotFound() {
  return (
    <>
      <GlobalStyles />
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100vh",
        background: "#0a0a0f", color: "#fff", gap: 16, fontFamily: "sans-serif"
      }}>
        <div style={{ fontSize: 48 }}>🏚</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Venue not found</div>
        <div style={{ fontSize: 14, color: "#888" }}>
          Check the URL or contact your administrator.
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Manually verify the file compiles**

```bash
cd /Users/tony/jarvid && npm run build 2>&1 | head -30
```

Expected: build succeeds (or only pre-existing warnings).

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add useVenue hook and VenueNotFound component"
```

---

## Task 4: Add `KioskRoute` component

The kiosk route is the public face of the app. It resolves the slug, then renders the existing PIN overlay + `KioskView`. After correct PIN, it navigates to `/:venueSlug/staff` instead of showing a login form.

**Files:**
- Modify: `src/App.jsx` (add after `VenueNotFound`, before `KioskBrowse` at ~line 616)

- [ ] **Step 1: Add `KioskRoute` to App.jsx**

The existing PIN logic lives in `App()` (lines ~5311–5344). Extract it into `KioskRoute`:

```jsx
// ─── KioskRoute ───────────────────────────────────────────────────────────────
function KioskRoute() {
  const { venueSlug } = useParams();
  const navigate = useNavigate();
  const { venueId, loading, notFound } = useVenue(venueSlug);

  // PIN state (extracted from App())
  const [kioskPin, setKioskPin] = useState(null);
  const [kioskLocked, setKioskLocked] = useState(true);
  const [showPinOverlay, setShowPinOverlay] = useState(false);
  const [pinEntry, setPinEntry] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinShake, setPinShake] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const logoTapTimer = useRef(null);

  // Load kiosk_pin once venueId is resolved
  useEffect(() => {
    if (!venueId) return;
    supabase.from("venues").select("kiosk_pin").eq("id", venueId).single()
      .then(({ data }) => setKioskPin(data?.kiosk_pin || "1234"))
      .catch(() => setKioskPin("1234"));
  }, [venueId]);

  const handleLogoTap = () => {
    if (!kioskLocked) return;
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    clearTimeout(logoTapTimer.current);
    if (newCount >= 5) {
      setLogoTapCount(0);
      setShowPinOverlay(true);
      setPinEntry("");
      setPinError("");
    } else {
      logoTapTimer.current = setTimeout(() => setLogoTapCount(0), 2000);
    }
  };

  const handlePinKey = (key) => {
    if (key === "clear") { setPinEntry(""); setPinError(""); return; }
    if (key === "back") { setPinEntry(p => p.slice(0, -1)); setPinError(""); return; }
    const next = pinEntry + key;
    setPinEntry(next);
    if (next.length === 4) {
      if (next === (kioskPin || "1234")) {
        setShowPinOverlay(false);
        setKioskLocked(false);
        setPinEntry("");
        setPinError("");
        // Navigate to staff route — auth guard will prompt login if needed
        navigate(`/${venueSlug}/staff`);
      } else {
        setPinError("Incorrect PIN. Try again.");
        setPinShake(true);
        setTimeout(() => { setPinEntry(""); setPinShake(false); }, 600);
      }
    }
  };

  if (loading) return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f" }}>
        <div className="spinner" />
      </div>
    </>
  );
  if (notFound) return <VenueNotFound />;

  return (
    <>
      <GlobalStyles />
      {showPinOverlay && (
        <div className="pin-overlay">
          <div className="pin-box" style={{ animation: pinShake ? "shake 0.4s" : "none" }}>
            <div className="pin-title">Staff Access</div>
            <div className="pin-sub">Enter your PIN to continue</div>
            <div className="pin-dots">
              {[0,1,2,3].map(i => (
                <div key={i} className={`pin-dot ${pinEntry.length > i ? (pinError ? "error" : "filled") : ""}`} />
              ))}
            </div>
            {pinError && <div className="pin-error">{pinError}</div>}
            <div className="pin-grid">
              {["1","2","3","4","5","6","7","8","9","clear","0","back"].map(k => (
                <button key={k} className={`pin-key${k==="clear"||k==="back" ? " pin-key-alt" : ""}`}
                  onClick={() => handlePinKey(k)}>
                  {k === "back" ? "⌫" : k === "clear" ? "C" : k}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <KioskView venueId={venueId} onLogoTap={handleLogoTap} />
    </>
  );
}
```

> **Note:** `KioskView` currently doesn't accept an `onLogoTap` prop — you'll need to wire it in Step 2.

- [ ] **Step 2: Wire `onLogoTap` into `KioskView`**

First, find all logo tap references:

```bash
grep -n "logoTap\|handleLogoTap\|onLogoTap\|logoTapCount\|setLogoTapCount" src/App.jsx
```

This will show you every location. You'll find two groups:
- **Inside `App()` (lines ~5311–5324):** the `logoTapCount` state and `handleLogoTap` function — these are moving to `KioskRoute` (already done in Step 1 above), so delete them from `App()` in Task 6.
- **Inside `KioskView` (line ~1269 area):** any reference to `handleLogoTap` on a logo element.

Update `KioskView`'s signature to accept the prop:

```jsx
function KioskView({ venueId: propVenueId, onLogoTap }) {
```

Then find the logo element inside `KioskView` that has the tap handler and replace its `onClick` with `onLogoTap`:

```jsx
onClick={onLogoTap}
```

If `KioskView` also contains its own `logoTapCount` state declarations (check the grep output), remove them — that state now lives in `KioskRoute`.

- [ ] **Step 3: Verify build still passes**

```bash
npm run build 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add KioskRoute with PIN logic and slug resolution"
```

---

## Task 5: Add `StaffRoute`, `VenuePicker`, and `RootPage`

**Files:**
- Modify: `src/App.jsx` (add after `KioskRoute`)

- [ ] **Step 1: Add `VenuePicker` component**

```jsx
// ─── VenuePicker ─────────────────────────────────────────────────────────────
function VenuePicker() {
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    supabase.from("venues").select("name, slug").order("name")
      .then(({ data }) => setVenues(data || []));
  }, []);

  return (
    <>
      <GlobalStyles />
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "100vh",
        background: "#0a0a0f", color: "#fff", gap: 24, padding: 32
      }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Select Venue</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 360 }}>
          {venues.map(v => (
            <Link key={v.slug} to={`/${v.slug}/staff`}
              style={{
                display: "block", padding: "14px 20px", borderRadius: 12,
                background: "#1a1a1f", border: "1px solid #2a2a2f",
                color: "#fff", textDecoration: "none", fontSize: 16, fontWeight: 500
              }}>
              {v.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Add `RootPage` component**

This handles the `/` route: shows login, redirects authenticated staff, or shows `VenuePicker` for super-admins.

```jsx
// ─── RootPage ─────────────────────────────────────────────────────────────────
function RootPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: staffData } = await supabase
          .from("staff_users")
          .select("role, venue_id, org_id")
          .eq("email", session.user.email)
          .eq("is_active", true)
          .single();
        if (staffData) setUser({ ...session.user, role: staffData.role, venue_id: staffData.venue_id, org_id: staffData.org_id });
      }
      setAuthChecked(true);
    });
  }, []);

  // Once we know auth state, handle redirects
  useEffect(() => {
    if (!authChecked || !user) return;

    const isSuperAdmin = user.role === "super_admin" || !user.venue_id;
    if (isSuperAdmin) return; // VenuePicker rendered below

    // Normal staff: resolve slug and redirect
    supabase.from("venues").select("slug").eq("id", user.venue_id).single()
      .then(({ data }) => {
        if (!data?.slug) return;
        // Honour ?next= if present and valid
        const params = new URLSearchParams(location.search);
        const next = params.get("next");
        const validNext = next && next.startsWith("/") && !next.includes("://") ? next : null;
        navigate(validNext ?? `/${data.slug}/staff`, { replace: true });
      });
  }, [authChecked, user, navigate, location.search]);

  if (!authChecked) return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f" }}>
        <div className="spinner" />
      </div>
    </>
  );

  const isSuperAdmin = user?.role === "super_admin" || (user && !user.venue_id);

  if (user && isSuperAdmin) return <VenuePicker />;

  // Not authenticated (or waiting on redirect effect) — show login
  const handleLogin = async (loggedInUser) => {
    setUser(loggedInUser);
    // redirect effect will fire on next render
  };

  return (
    <>
      <GlobalStyles />
      <LoginScreen onLogin={handleLogin} />
    </>
  );
}
```

- [ ] **Step 3: Add `StaffRoute` component**

```jsx
// ─── StaffRoute ───────────────────────────────────────────────────────────────
function StaffRoute() {
  const { venueSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { venueId, loading: venueLoading, notFound } = useVenue(venueSlug);

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        // Not authenticated — redirect to login with ?next= param
        navigate(`/?next=${encodeURIComponent(location.pathname)}`, { replace: true });
        return;
      }
      const { data: staffData } = await supabase
        .from("staff_users")
        .select("role, venue_id, org_id")
        .eq("email", session.user.email)
        .eq("is_active", true)
        .single();
      if (staffData) setUser({ ...session.user, role: staffData.role, venue_id: staffData.venue_id, org_id: staffData.org_id });
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  if (!authChecked || venueLoading) return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f" }}>
        <div className="spinner" />
      </div>
    </>
  );
  if (notFound) return <VenueNotFound />;

  // Render the full authenticated staff dashboard
  // Pass venueId and user down — the existing tab-based UI uses these
  return (
    <>
      <GlobalStyles />
      <StaffDashboard user={user} venueId={venueId} onLogout={handleLogout} />
    </>
  );
}
```

> **Note on `StaffDashboard`:** This is a thin wrapper you'll create in Task 6 that extracts the tab-based authenticated UI currently inside `App()` (lines ~5376–end of file). It accepts `{ user, venueId, onLogout }` as props.

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add StaffRoute, RootPage, VenuePicker components"
```

---

## Task 6: Extract `StaffDashboard` and replace `App()` with router

This is the largest refactor step. The existing `App()` function (line 5228) contains the full tab-based authenticated UI. Extract the authenticated rendering into `StaffDashboard`, then replace `App()` with a simple BrowserRouter wrapper.

**Files:**
- Modify: `src/App.jsx` (lines ~5228 to end)

- [ ] **Step 1: Create `StaffDashboard` by renaming/wrapping the existing authenticated UI**

First locate the exact lines to remove by running:

```bash
grep -n "isStaffMode\|kioskVenueId\|kioskPin\|loadPin\|handleLogin\|showLogin\|authChecked\|logoTapCount\|handleLogoTap\|handlePinKey\b" src/App.jsx | grep -v "^[0-9]*:.*function \|KioskRoute\|StaffRoute\|RootPage"
```

This shows the App() state/logic being removed. The lines will be in the 5229–5375 range.

**What to delete from App() (lines 5229–5375 approximately):**
- Lines 5229–5230: `urlParams` / `isStaffMode` query param reads
- Lines 5232: `activeTab` state (keep this — it moves to `StaffDashboard`)
- Lines 5236–5237: `showLogin` / `kioskLocked` state → delete
- Lines 5238–5245: `showPinOverlay`, `pinEntry`, `pinShake`, `logoTapCount`, `kioskPin`, `kioskVenueId` state → delete (now in `KioskRoute`)
- Lines 5248–5269: `loadPin` useEffect → delete (now in `KioskRoute`)
- Lines 5271–5290: auth `useEffect` → delete (now in `StaffRoute` / `RootPage`)
- Lines 5311–5324: `handleLogoTap` → delete (now in `KioskRoute`)
- Lines 5326–5344: `handlePinKey` → delete (now in `KioskRoute`)
- Lines 5346–5357: `handleLogin` → delete (login now in `RootPage`)
- Lines 5359–5372: `handleLogout` → keep but accept as prop
- Lines 5376: `if (!authChecked) return ...` → delete
- Lines 5383–5399: `isStaffMode` block → delete
- Line 5399: `if (showLogin)` → delete

**What to keep and move into `StaffDashboard`:**
- Pending count subscription (lines ~5292–5309)
- Tab visibility logic (lines ~5403–5414)
- The full `return (` JSX (lines 5416 to end)

The resulting `StaffDashboard` signature:

```jsx
function StaffDashboard({ user, venueId, onLogout }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (user?.role === "admin") return "admin";
    if (user?.role === "org_admin" || user?.role === "manager") return "manager";
    return "staff";
  });
  const [pendingCount, setPendingCount] = useState(0);
  // ... (keep existing pending count subscription, tab logic, and return JSX unchanged)
  // Replace handleLogout calls with onLogout prop
  // Replace kioskVenueId with venueId prop
}
```

- [ ] **Step 2: Replace `App()` with BrowserRouter setup**

Delete the existing `export default function App()` (lines 5228 to end of file) and replace with:

```jsx
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                   element={<RootPage />} />
        <Route path="/:venueSlug/kiosk"   element={<KioskRoute />} />
        <Route path="/:venueSlug/staff"   element={<StaffRoute />} />
        <Route path="*"                   element={<VenueNotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | head -40
```

Fix any import/reference errors before continuing.

- [ ] **Step 4: Manual smoke test — kiosk route**

```bash
npm run dev
```

Open `http://localhost:5173/<any-valid-slug>/kiosk` (use a slug from your backfilled `venues` table). Expected: kiosk welcome screen loads.

- [ ] **Step 5: Manual smoke test — unknown slug**

Open `http://localhost:5173/nonexistent-venue/kiosk`. Expected: "Venue not found" screen.

- [ ] **Step 6: Manual smoke test — root redirect**

Open `http://localhost:5173/`. Expected: login screen (if not authenticated).

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire BrowserRouter routes, extract StaffDashboard from App()"
```

---

## Task 7: Add slug field to venue admin panel

**Files:**
- Modify: `src/App.jsx` (around line ~4352 — the venue card in the admin panel)

- [ ] **Step 1: Add slug input to each venue card**

Find the section around line 4352 where the venue card renders the PIN field and Stripe connect button. Add a slug field just before the PIN field:

```jsx
{/* URL Slug */}
<div style={{ marginBottom: 10 }}>
  <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>URL Slug</div>
  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
    <span style={{ fontSize: 11, color: DS.colors.textMuted }}>app.jarv-id.com/</span>
    <input
      type="text"
      id={`slug-${v.id}`}
      defaultValue={v.slug || ""}
      key={`slug-${v.id}`}
      placeholder="venue-slug"
      style={{
        background: DS.colors.surface, border: `1px solid ${DS.colors.border}`,
        borderRadius: 6, padding: "6px 10px", color: DS.colors.text,
        fontSize: 13, fontFamily: DS.font.body, width: 140, outline: "none"
      }}
      onChange={e => {
        // Sanitise to lowercase alphanumeric + hyphens
        e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
      }}
    />
    <span style={{ fontSize: 11, color: DS.colors.textMuted }}>/kiosk</span>
    <button className="btn-sm btn-accent" onClick={async () => {
      const input = document.getElementById(`slug-${v.id}`);
      const newSlug = input?.value?.trim();
      if (!newSlug || !/^[a-z0-9-]+$/.test(newSlug)) {
        alert("Slug must be lowercase letters, numbers, and hyphens only");
        return;
      }
      const { error } = await supabase.from("venues").update({ slug: newSlug }).eq("id", v.id);
      if (error?.code === "23505") {
        alert("This slug is already taken — choose a different one");
      } else if (!error) {
        input.style.borderColor = DS.colors.accent;
        setTimeout(() => input.style.borderColor = DS.colors.border, 2000);
        loadVenues(); // refresh venue list
      }
    }}>Save</button>
  </div>
</div>
```

> **Note:** `loadVenues()` is the existing function that refreshes the venues list in the admin panel. If it has a different name, use the correct one.

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | head -20
```

- [ ] **Step 3: Manual smoke test — slug field**

Run `npm run dev`, log in as admin, navigate to the venues section. Expected: each venue card shows the slug field pre-populated. Edit a slug and save — verify it updates in Supabase.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add venue slug field to admin panel"
```

---

## Task 8: Add `vercel.json` and deploy

**Files:**
- Create: `vercel.json` (repo root)

- [ ] **Step 1: Create vercel.json at repo root**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

> **Important:** This catch-all rewrite is safe because all backend traffic goes directly to Supabase (not through Vercel). If API routes are ever added to this Vercel project, list them as explicit route entries before this rewrite.

- [ ] **Step 2: Commit vercel.json**

```bash
git add vercel.json
git commit -m "feat: add vercel.json SPA rewrite for app.jarv-id.com"
```

- [ ] **Step 3: Create a new Vercel project**

```bash
# Install Vercel CLI if not present
npm i -g vercel

# From repo root (NOT the landing/ subdirectory)
cd /Users/tony/jarvid
vercel link
```

When prompted: create a new project (not the existing `jarv-id-landing` project). Name it `jarv-id-app` or similar.

- [ ] **Step 4: Set environment variables on the new Vercel project**

Copy the existing env vars needed by the app (Supabase URL, Supabase anon key, Stripe publishable key):

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
```

- [ ] **Step 5: Deploy a preview**

```bash
vercel
```

Open the preview URL and verify:
- `<preview-url>/` → login screen
- `<preview-url>/<valid-slug>/kiosk` → kiosk screen
- `<preview-url>/nonexistent/kiosk` → "Venue not found"

- [ ] **Step 6: Add custom domain in Vercel dashboard**

In the Vercel dashboard for the new project: **Settings → Domains → Add `app.jarv-id.com`**.

Vercel will show a CNAME record to add. Add it in your DNS provider:
- Type: CNAME
- Name: `app`
- Value: `cname.vercel-dns.com`

- [ ] **Step 7: Deploy to production**

```bash
vercel --prod
```

- [ ] **Step 8: Verify live URL**

Open `https://app.jarv-id.com/<valid-slug>/kiosk`. Expected: kiosk loads over HTTPS.
