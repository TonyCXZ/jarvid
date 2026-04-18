# Stripe Terminal Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the card-not-present `CardElement` payment flow with a Stripe Terminal flow that drives the WisePOS E physical reader paired to each kiosk.

**Architecture:** A new `stripe-terminal-connection-token` Supabase edge function issues short-lived tokens to the kiosk. The Terminal JS SDK (`@stripe/terminal-js`) runs client-side, discovers the WisePOS E by its `tmr_...` ID stored in `kiosks.config`, and handles payment collection directly on the physical device. The existing `create-payment-intent` edge function and webhook handler are unchanged except for removing the `payment_method_types` restriction.

**Tech Stack:** `@stripe/terminal-js`, Supabase Edge Functions (Deno), React 19, Stripe API `2024-10-28.acacia`

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `supabase/functions/stripe-terminal-connection-token/index.ts` | **Create** | New edge function — issues Terminal connection tokens |
| `supabase/functions/create-payment-intent/index.ts` | **Modify** | Remove `payment_method_types: ["card"]` from PaymentIntent creation |
| `package.json` | **Modify** | Add `@stripe/terminal-js` |
| `src/App.jsx` line 1–6 | **Modify** | Remove `Elements`, `CardElement`, `useStripe`, `useElements` imports; add `loadStripeTerminal` |
| `src/App.jsx` `KioskView` (~line 1871) | **Modify** | Add `stripeReaderId` state; fetch `kiosks.config` after registration; pass `stripeReaderId` to `KioskPayment` |
| `src/App.jsx` `KioskPayment` / `KioskPaymentInner` (~line 1610) | **Modify** | Replace `CardForm`/`CardElement` with Terminal SDK reader flow |
| `src/App.jsx` settings section (~line 3978) | **Modify** | Add Reader ID card below PIN card in venue settings |
| `src/App.jsx` `loadKiosks` (~line 2902) | **Modify** | Include `config` in the kiosk select query for the settings UI |

---

## Task 1: New edge function — `stripe-terminal-connection-token`

**Files:**
- Create: `supabase/functions/stripe-terminal-connection-token/index.ts`

- [ ] **Step 1: Create the function file**

```typescript
import Stripe from "https://esm.sh/stripe@14.21.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-10-28.acacia",
    });

    const connectionToken = await stripe.terminal.connectionTokens.create();

    return new Response(
      JSON.stringify({ secret: connectionToken.secret }),
      { headers: CORS },
    );
  } catch (err) {
    console.error("stripe-terminal-connection-token error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: CORS },
    );
  }
});
```

- [ ] **Step 2: Deploy the new edge function**

```bash
cd /Users/tony/jarvid
npx supabase functions deploy stripe-terminal-connection-token --project-ref kidyoplpqmvebujypndu
```

Expected: `Deployed stripe-terminal-connection-token`

- [ ] **Step 3: Verify the function responds**

In the Supabase dashboard (project `jarvid`) → Edge Functions → `stripe-terminal-connection-token` → invoke it. It should return `{ "secret": "..." }`.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/stripe-terminal-connection-token/index.ts
git commit -m "feat: add stripe-terminal-connection-token edge function"
```

---

## Task 2: Update `create-payment-intent` for Terminal

**Files:**
- Modify: `supabase/functions/create-payment-intent/index.ts:67-73`

- [ ] **Step 1: Remove `payment_method_types` from PaymentIntent creation**

In `supabase/functions/create-payment-intent/index.ts`, find this block (around line 67):

```typescript
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPence,
      currency: "gbp",
      payment_method_types: ["card"],
      transfer_data: { destination: venue.stripe_account_id, amount: transferAmount },
      metadata: { venue_id, ...(order_id ? { order_id } : {}) },
    });
```

Replace with:

```typescript
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPence,
      currency: "gbp",
      capture_method: "automatic",
      transfer_data: { destination: venue.stripe_account_id, amount: transferAmount },
      metadata: { venue_id, ...(order_id ? { order_id } : {}) },
    });
```

- [ ] **Step 2: Deploy the updated function**

```bash
npx supabase functions deploy create-payment-intent --project-ref kidyoplpqmvebujypndu
```

Expected: `Deployed create-payment-intent`

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/create-payment-intent/index.ts
git commit -m "fix: remove payment_method_types from PaymentIntent for Terminal compatibility"
```

---

## Task 3: Add `@stripe/terminal-js` and fetch reader ID after kiosk registration

**Files:**
- Modify: `package.json`
- Modify: `src/App.jsx` line 1 (imports)
- Modify: `src/App.jsx` `KioskView` function (~line 1871)

- [ ] **Step 1: Install `@stripe/terminal-js`**

```bash
cd /Users/tony/jarvid
npm install @stripe/terminal-js
```

Expected: Package added to `dependencies` in `package.json`.

- [ ] **Step 2: Update the import at the top of `src/App.jsx`**

Find line 5 (current):
```javascript
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
```

Replace with:
```javascript
import { loadStripeTerminal } from "@stripe/terminal-js";
```

Note: `Elements`, `CardElement`, `useStripe`, `useElements` are only used in `CardForm` which will be removed in Task 4. Remove that import now so the file doesn't reference deleted things.

Also find line 4 (current):
```javascript
import { loadStripe } from "@stripe/stripe-js";
```

Keep this line — it's still used elsewhere in the app (admin Stripe Connect onboarding). Remove only the line 7:
```javascript
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```
If `stripePromise` is only used in `KioskPaymentInner` (search the file for `stripePromise` — if the only usage is in the `Elements` wrapper that will be removed in Task 4, delete this line too).

- [ ] **Step 3: Add `stripeReaderId` state to `KioskView`**

In `KioskView` (line ~1882), add state after the existing state declarations:

```javascript
const [stripeReaderId, setStripeReaderId] = useState(null);
```

- [ ] **Step 4: Fetch `kiosks.config` after successful registration**

In the `register()` function inside `KioskView` (around line 1935), both branches set `kioskDbId`. After each one, fetch the kiosk's config:

Find the block (around line 1936–1953):
```javascript
    const register = async () => {
      const { data } = await supabase.from("kiosks").select("id").eq("device_id", devId).single();
      if (data?.id) {
        // Existing kiosk — update heartbeat in-place
        setKioskDbId(data.id);
        await supabase.from("kiosks").update({ status: "online", last_heartbeat: new Date().toISOString() }).eq("id", data.id);
        heartbeatTimer.current = setInterval(() => sendHeartbeat(data.id, devId), 60000);
      } else {
        // New kiosk — insert first, only set state on success
        const newId = crypto.randomUUID();
        const { error } = await supabase.from("kiosks").insert({
          id: newId, device_id: devId, venue_id: venueId,
          name: kioskDisplayName, status: "online",
          last_heartbeat: new Date().toISOString(), app_version: "1.0.0",
          archived: false,
        });
        if (!error) {
          setKioskDbId(newId);
          heartbeatTimer.current = setInterval(() => sendHeartbeat(newId, devId), 60000);
        } else {
          console.error("Kiosk registration failed", error);
        }
      }
    };
```

Replace with:
```javascript
    const fetchReaderConfig = async (id) => {
      const { data } = await supabase.from("kiosks").select("config").eq("id", id).single();
      if (data?.config?.stripe_reader_id) {
        setStripeReaderId(data.config.stripe_reader_id);
      }
    };

    const register = async () => {
      const { data } = await supabase.from("kiosks").select("id").eq("device_id", devId).single();
      if (data?.id) {
        // Existing kiosk — update heartbeat in-place
        setKioskDbId(data.id);
        await supabase.from("kiosks").update({ status: "online", last_heartbeat: new Date().toISOString() }).eq("id", data.id);
        heartbeatTimer.current = setInterval(() => sendHeartbeat(data.id, devId), 60000);
        await fetchReaderConfig(data.id);
      } else {
        // New kiosk — insert first, only set state on success
        const newId = crypto.randomUUID();
        const { error } = await supabase.from("kiosks").insert({
          id: newId, device_id: devId, venue_id: venueId,
          name: kioskDisplayName, status: "online",
          last_heartbeat: new Date().toISOString(), app_version: "1.0.0",
          archived: false,
        });
        if (!error) {
          setKioskDbId(newId);
          heartbeatTimer.current = setInterval(() => sendHeartbeat(newId, devId), 60000);
          await fetchReaderConfig(newId);
        } else {
          console.error("Kiosk registration failed", error);
        }
      }
    };
```

- [ ] **Step 5: Pass `stripeReaderId` to `KioskPayment`**

Find the `KioskPayment` usage (around line 2100):
```javascript
      {screen === "payment" && (
        <KioskPayment
          cart={cart}
          products={products}
          verificationId={verificationId}
          kioskId={kioskId}
          venueId={venueId}
          onPaid={(oid) => { setPlacedOrderId(oid); setScreen("confirm"); }}
          onBack={() => setScreen("verify")}
          onHome={goHome}
        />
      )}
```

Replace with:
```javascript
      {screen === "payment" && (
        <KioskPayment
          cart={cart}
          products={products}
          verificationId={verificationId}
          kioskId={kioskId}
          venueId={venueId}
          stripeReaderId={stripeReaderId}
          onPaid={(oid) => { setPlacedOrderId(oid); setScreen("confirm"); }}
          onBack={() => setScreen("verify")}
          onHome={goHome}
        />
      )}
```

- [ ] **Step 6: Verify the app still loads**

```bash
npm run dev
```

Open the kiosk route. No console errors. `stripeReaderId` will be `null` until the DB row has `config.stripe_reader_id` set (that's fine — errors handled in Task 4).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/App.jsx
git commit -m "feat: add terminal-js package and fetch stripe_reader_id from kiosk config"
```

---

## Task 4: Replace `CardForm` / `CardElement` with Terminal SDK flow

**Files:**
- Modify: `src/App.jsx` — replace `CardForm` function (lines 1547–1605) and `KioskPaymentInner` (lines 1610–1732)

- [ ] **Step 1: Delete `CardForm` entirely**

Remove the entire block from the comment `// KIOSK — CARD FORM` through the closing `}` of the `CardForm` function (lines 1547–1605):

```javascript
// ============================================================
// KIOSK — CARD FORM (needs Elements context with clientSecret)
// ============================================================
function CardForm({ total, onPaid, orderId, clientSecret, phase, setPhase }) {
  ...
}
```

Delete all of it.

- [ ] **Step 2: Replace `KioskPaymentInner` with Terminal SDK version**

Replace the comment + function from `// KIOSK — PAYMENT (Stripe Elements)` through the end of `KioskPayment` (lines 1607–1732) with:

```javascript
// ============================================================
// KIOSK — PAYMENT (Stripe Terminal)
// ============================================================
function KioskPaymentInner({ cart, products, onPaid, onBack, onHome, verificationId, kioskId, venueId, stripeReaderId }) {
  const [phase, setPhase] = useState("loading"); // loading | connecting | waiting | processing | done | error
  const [orderId, setOrderId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);
  const terminalRef = useRef(null);

  const total = Object.entries(cart).reduce((s, [id, qty]) => {
    const p = products.find(x => x.id === id);
    return s + (p ? p.price * qty : 0);
  }, 0);

  useEffect(() => {
    if (!stripeReaderId) {
      setError("This kiosk is not configured for payments. Please ask a member of staff.");
      setPhase("error");
      return;
    }

    const init = async () => {
      try {
        // 1. Check stock
        for (const [id, qty] of Object.entries(cart)) {
          const { data: inv } = await supabase
            .from("inventory")
            .select("quantity")
            .eq("product_id", id)
            .eq("venue_id", venueId)
            .single();
          if (!inv || inv.quantity < qty) {
            const p = products.find(x => x.id === id);
            throw new Error(`Sorry, "${p?.name || "an item"}" is no longer available in the quantity requested.`);
          }
        }

        // 2. Create order (pending)
        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .insert({
            kiosk_id: kioskId || null,
            venue_id: venueId || null,
            status: "pending",
            total_pence: GBPtoPence(total),
            payment_method: "card",
            age_verification_id: verificationId || null,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (orderErr) throw orderErr;

        // 3. Create order items
        const items = Object.entries(cart).map(([id, qty]) => {
          const p = products.find(x => x.id === id);
          return { order_id: order.id, product_id: id, quantity: qty, unit_price_pence: GBPtoPence(p?.price || 0) };
        });
        const { error: itemsErr } = await supabase.from("order_items").insert(items);
        if (itemsErr) throw itemsErr;

        // 4. Decrement inventory
        for (const item of items) {
          await supabase.rpc("decrement_inventory", { p_product_id: item.product_id, p_venue_id: venueId || null, p_quantity: item.quantity });
        }

        setOrderId(order.id);

        // 5. Create Stripe payment intent
        const cartPayload = Object.entries(cart).map(([product_id, qty]) => {
          const p = products.find(x => x.id === product_id);
          return { product_id, qty, retail_pence: GBPtoPence(p?.price || 0) };
        });
        const { data: piData, error: piErr } = await supabase.functions.invoke("create-payment-intent", {
          body: { venue_id: venueId, cart: cartPayload, order_id: order.id },
        });
        if (piErr || !piData?.client_secret) throw new Error("Failed to initialise payment. Please try again.");
        setClientSecret(piData.client_secret);

        // 6. Initialise Terminal SDK and connect reader
        setPhase("connecting");
        const StripeTerminal = await loadStripeTerminal();
        const terminal = StripeTerminal.create({
          onFetchConnectionToken: async () => {
            const { data } = await supabase.functions.invoke("stripe-terminal-connection-token");
            if (!data?.secret) throw new Error("Failed to get Terminal connection token");
            return data.secret;
          },
          onUnexpectedReaderDisconnect: () => {
            setError("Payment reader disconnected. Please ask a member of staff.");
            setPhase("error");
          },
        });
        terminalRef.current = terminal;

        const discoverResult = await terminal.discoverReaders({ simulated: false });
        if (discoverResult.error) throw new Error("Could not discover payment reader. Please ask a member of staff.");

        const reader = discoverResult.discoveredReaders.find(r => r.id === stripeReaderId);
        if (!reader) throw new Error("Payment reader offline. Please ensure the reader is powered on and connected to the network.");

        const connectResult = await terminal.connectInternetReader(reader);
        if (connectResult.error) throw new Error("Could not connect to payment reader. Please ask a member of staff.");

        setPhase("waiting");

        // 7. Collect payment method on the reader
        const collectResult = await terminal.collectPaymentMethod(piData.client_secret);
        if (collectResult.error) {
          if (collectResult.error.code === "canceled") {
            setError("Payment was cancelled.");
          } else {
            setError(collectResult.error.message || "Payment could not be collected.");
          }
          setPhase("error");
          return;
        }

        setPhase("processing");

        // 8. Process (confirm) the payment
        const processResult = await terminal.processPayment(collectResult.paymentIntent);
        if (processResult.error) {
          setError(processResult.error.message || "Payment declined. Please try another card.");
          setPhase("error");
          return;
        }

        setPhase("done");
        setTimeout(() => onPaid(order.id), 1500);
      } catch (e) {
        console.error("Payment init error:", e);
        setError(e.message || "Unable to initialise payment. Please ask a member of staff.");
        setPhase("error");
      }
    };

    init();

    return () => {
      if (terminalRef.current) {
        terminalRef.current.disconnectReader().catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const phaseLabel = {
    loading: "PREPARING PAYMENT…",
    connecting: "CONNECTING TO READER…",
    waiting: "PRESENT CARD TO READER",
    processing: "PROCESSING…",
    done: "PAYMENT SUCCESS",
    error: "PAYMENT UNAVAILABLE",
  }[phase] ?? "PREPARING PAYMENT…";

  return (
    <div className="payment-screen" style={{ position: "relative" }}>
      <KioskNav onBack={phase === "waiting" ? onBack : undefined} onHome={phase !== "done" ? onHome : undefined} showBack={phase === "waiting"} />
      {error && <div className="error-banner" style={{ margin: "0 20px 16px" }}>{error}</div>}
      <div className="payment-heading">
        {phase === "done"
          ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><CheckCircle2 size={20} /> {phaseLabel}</span>
          : phaseLabel}
      </div>
      <div className="payment-amount">{fmt(total)}</div>

      {(phase === "loading" || phase === "connecting") && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 32 }}>
          <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: DS.colors.accent }} />
        </div>
      )}

      {phase === "waiting" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 32, gap: 16 }}>
          <div className="nfc-icon" style={{ borderColor: DS.colors.accent }}>
            <CreditCard size={36} style={{ color: DS.colors.accent }} />
          </div>
          <div style={{ fontSize: 15, color: DS.colors.textSub, textAlign: "center" }}>
            Tap, insert or swipe your card on the reader
          </div>
          <div style={{ fontSize: 13, color: DS.colors.textMuted, textAlign: "center" }}>Powered by Stripe · PCI DSS Compliant</div>
        </div>
      )}

      {phase === "processing" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 32 }}>
          <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: DS.colors.accent }} />
        </div>
      )}

      {phase === "done" && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <div className="nfc-icon" style={{ borderColor: DS.colors.accent }}><Check size={36} /></div>
        </div>
      )}

      {phase === "error" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 32, gap: 16 }}>
          <XCircle size={40} style={{ color: DS.colors.danger }} />
          <button className="btn-sm btn-outline" onClick={onBack} style={{ marginTop: 8 }}>Go Back</button>
        </div>
      )}
    </div>
  );
}

function KioskPayment(props) {
  return <KioskPaymentInner {...props} />;
}
```

- [ ] **Step 3: Verify the app builds without errors**

```bash
npm run build
```

Expected: Build succeeds. If you see unused import warnings for `Elements`, `loadStripe`, `stripePromise` — remove those too. Check with:
```bash
grep -n "stripePromise\|Elements\b\|CardElement\|useStripe\|useElements" src/App.jsx
```
Delete any remaining references that are no longer used.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: replace CardElement with Stripe Terminal SDK reader flow"
```

---

## Task 5: Admin UI — Reader ID field in venue settings

**Files:**
- Modify: `src/App.jsx` — `loadKiosks` function (~line 2902) and settings section (~line 3978)

- [ ] **Step 1: Add `config` to the `loadKiosks` select query**

Find `loadKiosks` (around line 2902):
```javascript
  const loadKiosks = async () => {
    const { data } = await supabase
      .from("kiosks")
      .select("id, name, status, last_heartbeat, app_version, device_id")
      .eq("venue_id", VENUE_ID);
```

Replace the select string:
```javascript
  const loadKiosks = async () => {
    const { data } = await supabase
      .from("kiosks")
      .select("id, name, status, last_heartbeat, app_version, device_id, config")
      .eq("venue_id", VENUE_ID);
```

- [ ] **Step 2: Add state for reader ID editing**

In the admin dashboard state block (around line 2845, near `pinEdit`), add:
```javascript
  const [readerIdEdits, setReaderIdEdits] = useState({}); // { [kioskId]: string }
  const [readerIdSaving, setReaderIdSaving] = useState({}); // { [kioskId]: bool }
  const [readerIdSaved, setReaderIdSaved] = useState({}); // { [kioskId]: bool }
```

- [ ] **Step 3: Add a `saveReaderId` function**

Add this function near `savePin` (around line 3144):

```javascript
  const saveReaderId = async (kioskId, readerId) => {
    setReaderIdSaving(s => ({ ...s, [kioskId]: true }));
    const trimmed = readerId.trim();
    const { data: existing } = await supabase.from("kiosks").select("config").eq("id", kioskId).single();
    const newConfig = { ...(existing?.config || {}), stripe_reader_id: trimmed || null };
    const { error } = await supabase.from("kiosks").update({ config: newConfig }).eq("id", kioskId);
    if (!error) {
      setReaderIdSaved(s => ({ ...s, [kioskId]: true }));
      setTimeout(() => setReaderIdSaved(s => ({ ...s, [kioskId]: false })), 3000);
    }
    setReaderIdSaving(s => ({ ...s, [kioskId]: false }));
  };
```

- [ ] **Step 4: Add the Reader ID card in the settings section**

Find the end of the PIN card in the settings section (around line 4023, after the `</div>` closing the PIN card):
```javascript
            </div>
          </>
        )}
```

Insert a new card between the PIN card's closing `</div>` and `</>`:

```javascript
            {kioskStatuses.length > 0 && (
              <div className="chart-card" style={{ maxWidth: 480, marginTop: 16 }}>
                <div className="chart-title" style={{ marginBottom: 4 }}>Terminal Reader</div>
                <div style={{ fontSize: 13, color: DS.colors.textMuted, marginBottom: 20 }}>
                  Pair each kiosk to its WisePOS E reader. Find the reader ID in Stripe Dashboard → Terminal → Readers.
                </div>
                {kioskStatuses.map(k => (
                  <div key={k.id} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      {k.name || k.device_id || "Kiosk"}
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="tmr_..."
                        defaultValue={k.config?.stripe_reader_id || ""}
                        onChange={e => setReaderIdEdits(s => ({ ...s, [k.id]: e.target.value }))}
                        style={{ flex: 1, background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: 8, padding: "10px 14px", color: DS.colors.text, fontSize: 14, fontFamily: DS.font.mono, outline: "none" }}
                      />
                      <button
                        className={`btn-sm ${readerIdSaved[k.id] ? "" : "btn-accent"}`}
                        onClick={() => saveReaderId(k.id, readerIdEdits[k.id] ?? k.config?.stripe_reader_id ?? "")}
                        disabled={readerIdSaving[k.id]}
                        style={readerIdSaved[k.id] ? { background: DS.colors.accentGlow, color: DS.colors.accent, borderColor: DS.colors.accent } : {}}
                      >
                        {readerIdSaving[k.id] ? "Saving…" : readerIdSaved[k.id] ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Saved</span> : "Save"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
```

- [ ] **Step 5: Verify build and manual test**

```bash
npm run build
```

Expected: Build succeeds.

Manual test: Open the admin → Settings tab → confirm the Terminal Reader card appears with a `tmr_...` input per kiosk. Enter a test value, click Save, refresh the page — value should persist (loaded from DB).

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add Terminal reader ID configuration to venue settings"
```

---

## Task 6: Deploy and smoke test

- [ ] **Step 1: Deploy to Vercel**

```bash
vercel --prod
```

Or push to `main` if auto-deploy is configured.

- [ ] **Step 2: Set a test reader ID in the admin**

In the admin Settings tab, enter the `tmr_...` ID of the WisePOS E (from Stripe Dashboard → Terminal → Readers). Click Save.

- [ ] **Step 3: Test the kiosk payment flow end-to-end**

1. Open the kiosk URL on the tablet
2. Add items to cart, proceed through age verification
3. Payment screen should show "CONNECTING TO READER…" then "PRESENT CARD TO READER"
4. The WisePOS E screen should show the payment prompt
5. Tap a test card — payment should complete
6. Confirmation screen appears
7. In Stripe Dashboard → Payments — the PaymentIntent should appear as `succeeded`
8. In Supabase → `orders` table — the order should have `status = completed`

- [ ] **Step 4: Commit any fixes discovered during smoke test**

---

## Notes

- **Simulated reader for testing:** While waiting for the WisePOS E to be physically registered in Stripe Dashboard, you can temporarily test with `simulated: true` in `discoverReaders` — Stripe provides a simulated reader that exercises the full Terminal SDK flow without hardware. Change back to `simulated: false` before go-live.
- **Live mode:** When switching to live Stripe keys, register the WisePOS E again in live mode (Stripe Dashboard → Terminal → Readers) — reader IDs are mode-specific. Update the reader ID in the admin settings after registering.
- **Stripe Connect:** The venue must complete Stripe Connect onboarding before payments will succeed. The connection token function does not require a connected account, but `create-payment-intent` will error if `stripe_account_id` is null.
