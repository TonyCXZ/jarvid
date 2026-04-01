# Device Fixed Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/kiosk` and `/staff` routes that resolve venue from localStorage (or `?venue=` param, or 6-digit code entry) so Hexnode only needs 2 profiles regardless of venue count.

**Architecture:** A `useVenueFromDevice()` hook runs a waterfall (localStorage → `?venue=` param → code entry screen). A `useReprovisionEscape()` hook handles the 5-tap → setup_code → reprovision flow. Two new route components (`KioskRouteDevice`, `StaffRouteDevice`) wrap the existing `KioskView` and `StaffView` using these hooks. All new code goes in `src/App.jsx` following the existing monolith pattern.

**Tech Stack:** Vite + React 18, React Router v6, Supabase JS client, existing DS design tokens, lucide-react icons.

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `supabase/migrations/20260401000000_add_venue_setup_code.sql` | Create | Adds `setup_code` column + unique index to `venues` |
| `src/App.jsx` | Modify ×5 | 1) New hooks + `VenueSetup` after `useVenue` (line ~455) · 2) `KioskRouteDevice` after `KioskRoute` (line ~585) · 3) `StaffRouteDevice` before `App()` (line ~6164) · 4) Route registration in `App()` · 5) Setup code UI in admin venue cards |

---

## Task 1: DB Migration — add `setup_code` to venues

**Files:**
- Create: `supabase/migrations/20260401000000_add_venue_setup_code.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260401000000_add_venue_setup_code.sql
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS setup_code TEXT
  CHECK (setup_code ~ '^\d{6}$');

CREATE UNIQUE INDEX IF NOT EXISTS venues_setup_code_unique
  ON venues (setup_code)
  WHERE setup_code IS NOT NULL;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected output: migration applied successfully. No errors. Existing rows get `setup_code = NULL` which satisfies the nullable constraint.

- [ ] **Step 3: Verify the column exists**

In Supabase Studio or via the MCP tool, run:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'venues' AND column_name = 'setup_code';
```
Expected: 1 row returned, `data_type = text`, `is_nullable = YES`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260401000000_add_venue_setup_code.sql
git commit -m "feat: add setup_code column to venues table"
```

---

## Task 2: `useVenueFromDevice` hook

**Files:**
- Modify: `src/App.jsx` — insert after line 455 (after the closing `}` of `useVenue`)

The `useVenue` function ends at line 455 with:
```javascript
  return { venueId, loading, notFound };
}
```

- [ ] **Step 1: Insert the constant and hook after `useVenue`**

Using the Edit tool, match the exact text below and insert the new code after it:

Find (the end of `useVenue`):
```javascript
  return { venueId, loading, notFound };
}

// ─── VenueNotFound ────────────────────────────────────────────────────────────
```

Replace with:
```javascript
  return { venueId, loading, notFound };
}

// ─── useVenueFromDevice hook ──────────────────────────────────────────────────
// Resolves venue for device routes (/kiosk, /staff) — no slug in the URL.
// Waterfall: localStorage → ?venue= query param → VenueSetup code entry.
const VENUE_CONFIG_KEY = "jarv-id:venue-config";

function useVenueFromDevice() {
  const [venueConfig, setVenueConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProvisioning(false);

    // Step 1: Check localStorage
    try {
      const stored = localStorage.getItem(VENUE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.venueId && parsed.venueSlug) {
          setVenueConfig(parsed);
          setLoading(false);
          return;
        }
      }
    } catch (_) {}

    // Step 2: Try ?venue=SLUG query param
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("venue");
    if (slug) {
      supabase.from("venues").select("id, name").eq("slug", slug).single()
        .then(({ data, error }) => {
          if (!error && data) {
            const config = { venueId: data.id, venueSlug: slug, venueLabel: data.name };
            localStorage.setItem(VENUE_CONFIG_KEY, JSON.stringify(config));
            setVenueConfig(config);
            setProvisioning(false);
          } else {
            setProvisioning(true);
          }
          setLoading(false);
        });
      return;
    }

    // Step 3: Fall through to manual code entry
    setProvisioning(true);
    setLoading(false);
  }, [epoch]);

  const reprovision = useCallback(() => {
    localStorage.removeItem(VENUE_CONFIG_KEY);
    setVenueConfig(null);
    setEpoch(e => e + 1);
  }, []);

  const onSetupComplete = useCallback((config) => {
    localStorage.setItem(VENUE_CONFIG_KEY, JSON.stringify(config));
    setVenueConfig(config);
    setProvisioning(false);
    setLoading(false);
  }, []);

  return {
    venueId: venueConfig?.venueId || null,
    venueSlug: venueConfig?.venueSlug || null,
    venueLabel: venueConfig?.venueLabel || null,
    loading,
    provisioning,
    reprovision,
    onSetupComplete,
  };
}

// ─── VenueNotFound ────────────────────────────────────────────────────────────
```

- [ ] **Step 2: Verify the file still builds**

```bash
npm run build 2>&1 | tail -5
```
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add useVenueFromDevice hook"
```

---

## Task 3: `VenueSetup` component

**Files:**
- Modify: `src/App.jsx` — insert right after the `useVenueFromDevice` hook, before the `// ─── VenueNotFound` comment

- [ ] **Step 1: Insert `VenueSetup` component**

Find:
```javascript
// ─── VenueNotFound ────────────────────────────────────────────────────────────
function VenueNotFound() {
```

Replace with:
```javascript
// ─── VenueSetup ──────────────────────────────────────────────────────────────
// Full-screen 6-digit code entry for device provisioning.
// Queries venues.setup_code to validate; on success writes localStorage.
function VenueSetup({ onComplete }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = async (c) => {
    setSubmitting(true);
    setError("");
    const { data, error: err } = await supabase
      .from("venues")
      .select("id, slug, name")
      .eq("setup_code", c)
      .single();
    setSubmitting(false);
    if (err || !data) {
      setError("Invalid code. Check with your administrator.");
      setShake(true);
      setTimeout(() => { setCode(""); setShake(false); }, 600);
      return;
    }
    onComplete({ venueId: data.id, venueSlug: data.slug, venueLabel: data.name });
  };

  const handleKey = (key) => {
    if (submitting) return;
    if (key === "back") { setCode(c => c.slice(0, -1)); setError(""); return; }
    if (key === "clear") { setCode(""); setError(""); return; }
    if (code.length >= 6) return;
    const next = code + key;
    setCode(next);
    if (next.length === 6) submit(next);
  };

  return (
    <>
      <GlobalStyles />
      <div style={{
        width: "100%", height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: DS.colors.bg, color: DS.colors.text, fontFamily: DS.font.body,
        gap: 0,
      }}>
        <div style={{ fontFamily: DS.font.display, fontSize: 42, letterSpacing: "0.1em", color: DS.colors.accent, marginBottom: 6 }}>
          JARV-ID
        </div>
        <div style={{ fontSize: 15, color: DS.colors.textSub, marginBottom: 40 }}>
          Enter your 6-digit venue setup code
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 8, animation: shake ? "shake 0.4s ease" : "none" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              width: 44, height: 56, borderRadius: 8, display: "flex", alignItems: "center",
              justifyContent: "center", background: DS.colors.surface,
              border: `2px solid ${code.length > i ? DS.colors.accent : DS.colors.border}`,
              fontSize: 26, fontFamily: DS.font.display, color: DS.colors.accent,
            }}>
              {code[i] ? "•" : ""}
            </div>
          ))}
        </div>
        <div style={{ height: 24, display: "flex", alignItems: "center", marginBottom: 24 }}>
          {error && <div style={{ color: DS.colors.danger, fontSize: 13 }}>{error}</div>}
          {submitting && <div style={{ color: DS.colors.textSub, fontSize: 13 }}>Checking…</div>}
        </div>
        <div className="pin-grid">
          {["1","2","3","4","5","6","7","8","9"].map(k => (
            <button key={k} className="pin-key" onClick={() => handleKey(k)}>{k}</button>
          ))}
          <button className="pin-key" onClick={() => handleKey("clear")} style={{ fontSize: 13, color: DS.colors.textMuted }}>CLR</button>
          <button className="pin-key" onClick={() => handleKey("0")}>0</button>
          <button className="pin-key" onClick={() => handleKey("back")}><X size={16} /></button>
        </div>
      </div>
    </>
  );
}

// ─── VenueNotFound ────────────────────────────────────────────────────────────
function VenueNotFound() {
```

- [ ] **Step 2: Check the `pin-grid` CSS class exists**

Search `src/App.jsx` for `.pin-grid` to confirm it is defined in `GlobalStyles`.

Run: `grep -n "pin-grid" src/App.jsx | head -5`

Expected: at least one line showing `.pin-grid` defined in a CSS string (likely in the `GlobalStyles` component). If it does NOT exist, check for `pin-key` — if pin keys are styled via a different class, adjust the grid wrapper to use an inline style instead:

```jsx
<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 72px)", gap: 10 }}>
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add VenueSetup provisioning screen"
```

---

## Task 4: `useReprovisionEscape` hook

**Files:**
- Modify: `src/App.jsx` — insert between `VenueSetup` and `VenueNotFound`

- [ ] **Step 1: Insert the hook**

Find:
```javascript
// ─── VenueNotFound ────────────────────────────────────────────────────────────
function VenueNotFound() {
  return (
```

Replace with:
```javascript
// ─── useReprovisionEscape hook ───────────────────────────────────────────────
// 5-tap logo trigger + 6-digit setup_code overlay → clears venue and reprovisions.
function useReprovisionEscape(setupCode, reprovision) {
  const [escapeActive, setEscapeActive] = useState(false);
  const [escapeEntry, setEscapeEntry] = useState("");
  const [escapeError, setEscapeError] = useState("");
  const [escapeShake, setEscapeShake] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  // Call from a tap handler to count taps; triggers overlay after 5 within 2s
  const handleEscapeTap = useCallback(() => {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      setEscapeActive(true);
      setEscapeEntry("");
      setEscapeError("");
    } else {
      tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    }
  }, []);

  // Call directly (e.g., from StaffView's onUnlock) to show the overlay
  const triggerEscape = useCallback(() => {
    setEscapeActive(true);
    setEscapeEntry("");
    setEscapeError("");
  }, []);

  const handleEscapeKey = useCallback((key) => {
    if (key === "clear") { setEscapeEntry(""); setEscapeError(""); return; }
    if (key === "back") { setEscapeEntry(e => e.slice(0, -1)); setEscapeError(""); return; }
    setEscapeEntry(prev => {
      if (prev.length >= 6) return prev;
      const next = prev + key;
      if (next.length === 6) {
        if (next === setupCode) {
          setEscapeActive(false);
          setEscapeEntry("");
          reprovision();
        } else {
          setEscapeError("Invalid code.");
          setEscapeShake(true);
          setTimeout(() => { setEscapeEntry(""); setEscapeShake(false); setEscapeError(""); }, 600);
        }
        return "";
      }
      return next;
    });
  }, [setupCode, reprovision]);

  const dismissEscape = useCallback(() => {
    setEscapeActive(false);
    setEscapeEntry("");
    setEscapeError("");
  }, []);

  return {
    escapeActive, escapeEntry, escapeError, escapeShake,
    handleEscapeTap, triggerEscape, handleEscapeKey, dismissEscape,
  };
}

// ─── VenueNotFound ────────────────────────────────────────────────────────────
function VenueNotFound() {
  return (
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add useReprovisionEscape hook"
```

---

## Task 5: `KioskRouteDevice` component

**Files:**
- Modify: `src/App.jsx` — insert after `KioskRoute` ends (after line ~585)

`KioskRoute` ends with:
```javascript
      <KioskView venueId={venueId} kioskSlug={kioskSlug} />
    </>
  );
}
```
followed by:
```javascript
// ============================================================
// UTILITY
```

- [ ] **Step 1: Insert `KioskRouteDevice` after `KioskRoute`**

Find:
```javascript
      <KioskView venueId={venueId} kioskSlug={kioskSlug} />
    </>
  );
}

// ============================================================
// UTILITY
```

Replace with:
```javascript
      <KioskView venueId={venueId} kioskSlug={kioskSlug} />
    </>
  );
}

// ─── KioskRouteDevice ────────────────────────────────────────────────────────
// Fixed /kiosk route for Hexnode-provisioned tablets.
// Resolves venue from localStorage (or ?venue= param, or VenueSetup screen).
// 5-tap logo → enter setup_code → reprovision device.
function KioskRouteDevice() {
  const { venueId, loading, provisioning, reprovision, onSetupComplete } = useVenueFromDevice();

  const [kioskPin, setKioskPin] = useState(null);
  const [setupCode, setSetupCode] = useState(null);

  useEffect(() => {
    if (!venueId) return;
    supabase.from("venues").select("kiosk_pin, setup_code").eq("id", venueId).single()
      .then(({ data }) => {
        setKioskPin(data?.kiosk_pin || "1234");
        setSetupCode(data?.setup_code || null);
      })
      .catch(() => setKioskPin("1234"));
  }, [venueId]);

  const { escapeActive, escapeEntry, escapeError, escapeShake, handleEscapeTap, handleEscapeKey, dismissEscape } =
    useReprovisionEscape(setupCode, reprovision);

  const handleLogoTap = () => {
    if (escapeActive) return;
    handleEscapeTap();
  };

  if (loading) return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: DS.colors.bg }}>
        <div className="spinner" />
      </div>
    </>
  );

  if (provisioning) return <VenueSetup onComplete={onSetupComplete} />;

  return (
    <>
      <GlobalStyles />
      {/* Reprovision escape overlay — triggered by 5-tap on logo */}
      {escapeActive && (
        <div className="pin-overlay">
          <div className="pin-card" style={{ animation: escapeShake ? "shake 0.4s ease" : "none" }}>
            <div className="pin-title">Admin: Enter Setup Code</div>
            <div className="pin-dots">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="pin-dot" style={{ background: escapeEntry.length > i ? DS.colors.accent : DS.colors.border }} />
              ))}
            </div>
            <div className="pin-grid">
              {["1","2","3","4","5","6","7","8","9"].map(k => (
                <button key={k} className="pin-key" onClick={() => handleEscapeKey(k)}>{k}</button>
              ))}
              <button className="pin-key" onClick={() => handleEscapeKey("clear")} style={{ fontSize: 13, color: DS.colors.textMuted }}>CLR</button>
              <button className="pin-key" onClick={() => handleEscapeKey("0")}>0</button>
              <button className="pin-key" onClick={() => handleEscapeKey("back")}><X size={16} /></button>
            </div>
            <div className="pin-error-msg">{escapeError}</div>
            <button className="btn-sm btn-outline" style={{ marginTop: 8, width: "100%" }} onClick={dismissEscape}>Cancel</button>
          </div>
        </div>
      )}
      {/* Logo tap target (invisible, positioned over the logo area) */}
      <div
        style={{ position: "fixed", top: 0, left: 0, width: 80, height: 80, zIndex: 20, cursor: "default" }}
        onClick={handleLogoTap}
      />
      <KioskView venueId={venueId} kioskSlug={null} />
    </>
  );
}

// ============================================================
// UTILITY
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add KioskRouteDevice for fixed /kiosk route"
```

---

## Task 6: `StaffRouteDevice` component

**Files:**
- Modify: `src/App.jsx` — insert after `StaffRoute` ends and before `export default function App()`

`StaffRoute` ends at approximately:
```javascript
      <StaffDashboard user={user} venueId={venueId} onLogout={handleLogout} />
    </>
  );
}

export default function App() {
```

- [ ] **Step 1: Insert `StaffRouteDevice` before `export default function App()`**

Find:
```javascript
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
```

Replace with:
```javascript
// ─── StaffRouteDevice ────────────────────────────────────────────────────────
// Fixed /staff route for Hexnode-provisioned staff tablets.
// Kioskoid mode — no Supabase auth required, just the venue PIN lock.
// 5-tap on "STAFF ORDERS" heading → enter setup_code → reprovision device.
function StaffRouteDevice() {
  const { venueId, loading, provisioning, reprovision, onSetupComplete } = useVenueFromDevice();

  const [kioskPin, setKioskPin] = useState(null);
  const [setupCode, setSetupCode] = useState(null);

  useEffect(() => {
    if (!venueId) return;
    supabase.from("venues").select("kiosk_pin, setup_code").eq("id", venueId).single()
      .then(({ data }) => {
        setKioskPin(data?.kiosk_pin || "1234");
        setSetupCode(data?.setup_code || null);
      })
      .catch(() => setKioskPin("1234"));
  }, [venueId]);

  const { escapeActive, escapeEntry, escapeError, escapeShake, triggerEscape, handleEscapeKey, dismissEscape } =
    useReprovisionEscape(setupCode, reprovision);

  if (loading) return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: DS.colors.bg }}>
        <div className="spinner" />
      </div>
    </>
  );

  if (provisioning) return <VenueSetup onComplete={onSetupComplete} />;

  return (
    <>
      <GlobalStyles />
      {/* Reprovision escape overlay — triggered by 5-tap on "STAFF ORDERS" heading */}
      {escapeActive && (
        <div className="pin-overlay">
          <div className="pin-card" style={{ animation: escapeShake ? "shake 0.4s ease" : "none" }}>
            <div className="pin-title">Admin: Enter Setup Code</div>
            <div className="pin-dots">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="pin-dot" style={{ background: escapeEntry.length > i ? DS.colors.accent : DS.colors.border }} />
              ))}
            </div>
            <div className="pin-grid">
              {["1","2","3","4","5","6","7","8","9"].map(k => (
                <button key={k} className="pin-key" onClick={() => handleEscapeKey(k)}>{k}</button>
              ))}
              <button className="pin-key" onClick={() => handleEscapeKey("clear")} style={{ fontSize: 13, color: DS.colors.textMuted }}>CLR</button>
              <button className="pin-key" onClick={() => handleEscapeKey("0")}>0</button>
              <button className="pin-key" onClick={() => handleEscapeKey("back")}><X size={16} /></button>
            </div>
            <div className="pin-error-msg">{escapeError}</div>
            <button className="btn-sm btn-outline" style={{ marginTop: 8, width: "100%" }} onClick={dismissEscape}>Cancel</button>
          </div>
        </div>
      )}
      <StaffView
        user={null}
        kioskoidMode={true}
        venueIdOverride={venueId}
        kioskPin={kioskPin}
        onUnlock={triggerEscape}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add StaffRouteDevice for fixed /staff route"
```

---

## Task 7: Route registration

**Files:**
- Modify: `src/App.jsx` — update the `<Routes>` block in `App()`

- [ ] **Step 1: Add new routes before the slug routes**

Find:
```jsx
        <Route path="/"                   element={<RootPage />} />
        <Route path="/:venueSlug/kiosk"              element={<KioskRoute />} />
        <Route path="/:venueSlug/kiosk/:kioskSlug"  element={<KioskRoute />} />
        <Route path="/:venueSlug/staff"   element={<StaffRoute />} />
        <Route path="*"                   element={<VenueNotFound />} />
```

Replace with:
```jsx
        <Route path="/"                              element={<RootPage />} />
        <Route path="/kiosk"                         element={<KioskRouteDevice />} />
        <Route path="/staff"                         element={<StaffRouteDevice />} />
        <Route path="/:venueSlug/kiosk"              element={<KioskRoute />} />
        <Route path="/:venueSlug/kiosk/:kioskSlug"   element={<KioskRoute />} />
        <Route path="/:venueSlug/staff"              element={<StaffRoute />} />
        <Route path="*"                              element={<VenueNotFound />} />
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 3: Smoke test — navigate to `/kiosk` in dev server**

```bash
npm run dev
```

Open `http://localhost:5173/kiosk` in the browser. Expected: the VenueSetup screen loads (6-digit code entry, dark background, JARV-ID heading in amber).

Open `http://localhost:5173/kiosk?venue=<a-valid-slug>` where `<a-valid-slug>` is a real slug in your dev Supabase. Expected: the kiosk welcome screen loads (VenueSetup is skipped; localStorage is written).

Open `http://localhost:5173/staff`. Expected: VenueSetup screen (or if localStorage was just written by the kiosk test above, the staff order queue in kioskoid mode).

Open `http://localhost:5173/<any-existing-slug>/kiosk`. Expected: existing KioskRoute still works.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: register /kiosk and /staff device routes"
```

---

## Task 8: Admin portal — setup code UI

**Files:**
- Modify: `src/App.jsx` — add setup_code field in the admin venue card, between the Kiosk PIN section and the Stripe section

The Kiosk PIN section ends with these lines (around line 4838):
```jsx
                        <button className="btn-sm btn-accent" onClick={async () => {
                          const input = document.getElementById(`pin-${v.id}`);
                          const newPin = input?.value;
                          if (!newPin || newPin.length < 4) { alert("PIN must be at least 4 digits"); return; }
                          const { error } = await supabase.from("venues").update({ kiosk_pin: newPin }).eq("id", v.id);
                          if (!error) { input.style.borderColor = DS.colors.accent; setTimeout(() => input.style.borderColor = DS.colors.border, 2000); }
                        }}>Save</button>
                      </div>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      {v.stripe_account_id ? (
```

- [ ] **Step 1: Insert setup code section after Kiosk PIN section**

Find:
```jsx
                        }}>Save</button>
                      </div>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      {v.stripe_account_id ? (
```

Replace with:
```jsx
                        }}>Save</button>
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: DS.colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Setup Code</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          defaultValue={v.setup_code || ""}
                          key={`sc-${v.id}`}
                          id={`sc-${v.id}`}
                          placeholder="——————"
                          style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: 6, padding: "6px 10px", color: DS.colors.accent, fontSize: 16, fontFamily: DS.font.display, fontWeight: 700, width: 90, outline: "none", letterSpacing: "0.15em" }}
                          onChange={e => e.target.value = e.target.value.replace(/\D/g, "")}
                        />
                        <button className="btn-sm btn-accent" onClick={async () => {
                          const input = document.getElementById(`sc-${v.id}`);
                          const newCode = input?.value;
                          if (!newCode || newCode.length !== 6) { alert("Setup code must be exactly 6 digits"); return; }
                          const { error } = await supabase.from("venues").update({ setup_code: newCode }).eq("id", v.id);
                          if (error?.code === "23505") { alert("This code is already used by another venue — choose a different one"); }
                          else if (!error) { input.style.borderColor = DS.colors.accent; setTimeout(() => input.style.borderColor = DS.colors.border, 2000); loadVenues(); }
                        }}>Save</button>
                        <button className="btn-sm btn-outline" onClick={async () => {
                          const newCode = String(Math.floor(100000 + Math.random() * 900000));
                          const { error } = await supabase.from("venues").update({ setup_code: newCode }).eq("id", v.id);
                          if (error?.code === "23505") { alert("Generated code already taken — try again"); }
                          else if (!error) { loadVenues(); }
                        }}>Regen</button>
                      </div>
                      <div style={{ fontSize: 11, color: DS.colors.textMuted, marginTop: 4 }}>
                        Used for device provisioning and re-provisioning
                      </div>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      {v.stripe_account_id ? (
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 3: Smoke test the admin UI**

In the dev server, log in as super admin → navigate to Venues section → open a venue card. Expected: a "Setup Code" row appears between Kiosk PIN and the Stripe section, with an empty input and Save + Regen buttons.

Enter `123456` and click Save. Expected: input border flashes amber, venue reloads with code `123456` persisted.

Click Regen. Expected: a new random 6-digit code is generated and saved; the input updates.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add setup code field to admin venue cards"
```

---

## Task 9: End-to-end verification

- [ ] **Step 1: Clear localStorage and test full provisioning flow**

In browser DevTools → Application → Local Storage → delete `jarv-id:venue-config`.

Navigate to `http://localhost:5173/kiosk`. Expected: VenueSetup screen (code entry).

Enter the setup code you set in Task 8 for a test venue. Expected: VenueSetup disappears, kiosk welcome screen loads.

- [ ] **Step 2: Test reprovision escape on `/kiosk`**

On the kiosk welcome screen, tap (click) the top-left area of the screen 5 times quickly. Expected: "Admin: Enter Setup Code" overlay appears.

Enter the wrong code. Expected: dots shake, "Invalid code." error shown, input resets.

Enter the correct setup code. Expected: overlay closes, VenueSetup screen returns.

- [ ] **Step 3: Test `/staff` provisioning and escape**

Navigate to `http://localhost:5173/staff`. Expected: VenueSetup screen.

Enter the setup code. Expected: staff order queue loads in kioskoid mode.

Tap "STAFF ORDERS" heading 5 times. Expected: "Admin: Enter Setup Code" overlay appears.

Enter the correct code. Expected: localStorage cleared, VenueSetup screen returns.

- [ ] **Step 4: Test `?venue=` auto-seed**

Clear localStorage. Navigate to `http://localhost:5173/kiosk?venue=<valid-slug>`. Expected: kiosk welcome screen loads directly (no code entry). Check DevTools localStorage — `jarv-id:venue-config` should be written with the correct venueId/venueSlug/venueLabel.

- [ ] **Step 5: Test existing slug routes still work**

Navigate to `http://localhost:5173/<slug>/kiosk`. Expected: existing kiosk loads via `KioskRoute` (no change).

Navigate to `http://localhost:5173/<slug>/staff`. Expected: redirects to login if unauthenticated (unchanged `StaffRoute` behaviour).

- [ ] **Step 6: Final commit**

```bash
git add -p  # verify nothing unexpected is staged
git commit -m "feat: complete device fixed routes — /kiosk and /staff ready for Hexnode"
```
