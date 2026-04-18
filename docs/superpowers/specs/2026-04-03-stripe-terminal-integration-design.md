# Stripe Terminal Integration Design

**Date:** 2026-04-03
**Status:** Approved

---

## Overview

Replace the current card-not-present `CardElement` payment flow on the kiosk with a Stripe Terminal flow that drives the WisePOS E physical reader. Each kiosk is paired 1-to-1 with a WisePOS E; the reader ID is stored in `kiosks.config.stripe_reader_id`.

---

## Architecture

The Terminal SDK runs entirely client-side on the kiosk tablet. The only new server interaction is the connection token endpoint (called once on boot). All other server interactions (PaymentIntent creation, webhook fulfilment) are unchanged.

```
Kiosk boot
  → POST stripe-terminal-connection-token  (new edge fn)
  → Terminal SDK connects to WisePOS E    (reader ID from kiosks.config)

Customer checks out
  → POST create-payment-intent            (existing, minor tweak)
  → Terminal: collectPaymentMethod        (customer taps/chips on WisePOS E)
  → Terminal: processPayment
  → onPaid() → existing confirmation flow
  → Stripe webhook fires → order marked complete in DB
```

---

## Components

### 1. New edge function — `stripe-terminal-connection-token`

- **Path:** `supabase/functions/stripe-terminal-connection-token/index.ts`
- **Method:** POST
- **Auth:** anon key (same as other kiosk-facing functions)
- **What it does:** Calls `stripe.terminal.connectionTokens.create()` and returns `{ secret }` to the kiosk
- **Called:** Once on kiosk boot; re-called automatically by the Terminal SDK when the token expires or connection drops

### 2. Update `create-payment-intent`

- **File:** `supabase/functions/create-payment-intent/index.ts`
- **Change:** Remove `payment_method_types: ["card"]` from `stripe.paymentIntents.create()` — Terminal selects the payment method itself
- Everything else (Connect transfer, order creation, metadata) is unchanged

### 3. Kiosk payment UI — replace `CardForm` / `CardElement`

- **File:** `src/App.jsx`
- **Components affected:** `KioskPaymentInner`, `CardForm`
- **Package added:** `@stripe/terminal-js`
- Remove `CardElement`, `useElements`, `useStripe` from the payment screen
- Replace with Terminal SDK flow:
  1. `StripeTerminal.create({ onFetchConnectionToken })` — initialised once, stored in a ref
  2. `terminal.connectReader(reader)` — using `stripe_reader_id` from `kiosks.config`
  3. `terminal.collectPaymentMethod(clientSecret)` — WisePOS E shows tap/chip prompt
  4. `terminal.processPayment(paymentIntent)` — confirms the PI
  5. On success → call existing `onPaid(orderId)`
- UI during payment: single screen showing amount + "Present card to reader" message. No card input fields.

### 4. Admin kiosk config — Reader ID field

- **File:** `src/App.jsx` — admin kiosk management section
- Add a "Stripe Reader ID" text input to the kiosk card (alongside existing fields)
- Reads from and saves to `kiosks.config.stripe_reader_id`
- Displayed as a small helper text: "Find this in Stripe Dashboard → Terminal → Readers"

---

## Data

No migration required. `kiosks.config` is already a JSONB column. The reader ID is stored as:

```json
{ "stripe_reader_id": "tmr_..." }
```

---

## Error Handling

| Condition | User-facing message | Behaviour |
|-----------|-------------------|-----------|
| No `stripe_reader_id` in kiosk config | "This kiosk is not configured for payments. Please ask staff." | Fail before reaching payment screen |
| Reader unreachable (not on same WiFi) | "Payment reader offline. Please ask staff." | Show retry button |
| Connection token fetch fails | "Payment reader offline. Please ask staff." | Show retry button |
| Payment declined | Decline reason from Terminal SDK | Allow retry or go back |
| Network drops mid-payment | "Payment could not be completed." | Show back option; Terminal SDK handles in-flight recovery |

---

## Out of Scope

- Yoti age verification integration
- Multi-reader venues (future: each kiosk already has its own `stripe_reader_id`, so this will work automatically)
- Switching between Terminal and card-not-present as a fallback

---

## Pre-Live Steps (outside this code change)

These must be completed in the Stripe Dashboard before going live:

1. Create a Terminal **Location** for the venue (store address)
2. Register the WisePOS E to that location — pairing code shown on device screen
3. Note the `tmr_...` reader ID → enter it in the Admin kiosk config
4. In live mode: repeat steps 1–3 (Terminal readers are mode-specific)
