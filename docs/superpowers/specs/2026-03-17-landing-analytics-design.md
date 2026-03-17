# Landing Page Analytics Design

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** Add Google Analytics 4 tracking and a GDPR-compliant cookie consent bar to the jarv-id.com landing page.

---

## Platform

Google Analytics 4 via `gtag.js`. Free tier.

The GA4 Measurement ID must be defined as a constant at the top of the analytics script block:

```js
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX"; // TODO: replace with real Measurement ID from GA4 dashboard
```

The placeholder `G-XXXXXXXXXX` must remain until replaced. The ID must be filled in before the branch is merged.

---

## Cookie Consent Bar

A slim fixed bar pinned to the bottom of the viewport. It appears on first visit when no consent preference is stored.

**Styling:**
- Background: `#131110` (matches site surface colour)
- Text: `#9a9080` (muted)
- Accept button: amber `#f0a830` background, dark text, matches existing CTA style
- Decline button: transparent background, `#5c5448` border, muted text
- `z-index: 200` (above the nav bar at z-index 100)
- Full-width, padding `16px 24px`, flex row, space-between on desktop / stacked on mobile

**Copy:**

> "We use cookies to understand how visitors use this site and improve it. No data is shared or sold."  [Accept] [Decline]

A privacy/cookie policy page is out of scope for this implementation. No policy link is required at this stage. This should be revisited before significant traffic volumes are reached.

**Behaviour:**
- Bar is hidden by default via `display: none`
- On page load: read `localStorage.getItem('jarv_analytics_consent')` inside a try/catch (handles browsers where localStorage is unavailable, e.g. strict private browsing — default to not loading GA on error)
  - Value `"granted"` → initialise GA immediately, bar stays hidden
  - Value `"denied"` → bar stays hidden, GA never loads
  - No value / error → show bar, GA does not load
- **Accept:** save `"granted"` to localStorage, hide bar, dynamically inject GA script (see below), update consent
- **Decline:** save `"denied"` to localStorage, hide bar, do nothing else

---

## GA Initialisation

GA must not make any network requests before the user accepts. The implementation must:

1. Place the `gtag` stub function and `window.dataLayer` initialisation in `<head>` (no network request)
2. Call `gtag('consent', 'default', { analytics_storage: 'denied' })` in `<head>`
3. Do **not** place a static `<script src="https://www.googletagmanager.com/gtag/js?id=...">` tag in `<head>`
4. On acceptance only, dynamically inject the GA script:

```js
const script = document.createElement('script');
script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
script.async = true;
document.head.appendChild(script);
gtag('consent', 'update', { analytics_storage: 'granted' });
gtag('config', GA_MEASUREMENT_ID);
```

**Note:** The page already loads Google Fonts unconditionally from `<head>`. Fonts are outside the scope of analytics consent and are not addressed here.

---

## Events Tracked

| Event | Trigger | Parameters |
|---|---|---|
| `page_view` | Automatic via GA4 | — |
| `form_start` | First interaction with any form field | — |
| `form_field_complete` | `blur` on each named field, after the field has a non-empty value | `field_name` |
| `form_abandon` | `beforeunload` fires, `formStarted` is true, `formSubmitSuccess` is false | — |
| `form_submit_attempt` | Submit button clicked | — |
| `form_submit_success` | API returns `{ success: true }` | — |
| `form_submit_error` | API response is not ok (`!res.ok`) OR response body does not contain `success: true` | — |

**Implementation notes:**

- `form_start` uses an in-memory boolean flag `formStarted` (initialised `false`). Set to `true` on first field interaction. No sessionStorage needed — the page is single-file with no navigation.
- `form_abandon` uses a second boolean flag `formSubmitSuccess` (initialised `false`). Set to `true` inside the success handler (before the DOM replacement). The `beforeunload` handler fires `form_abandon` only if `formStarted && !formSubmitSuccess`.
- `form_field_complete` uses `addEventListener('blur', ...)` on each field. `blur` fires correctly on `<select>` elements in all modern browsers; minor inconsistencies on older mobile browsers are accepted for this spec.
- All `gtag('event', ...)` calls must be guarded: only fire if consent is `"granted"` (check the localStorage value or an in-memory `analyticsEnabled` flag set at initialisation time).

---

## Implementation Approach

All changes confined to `landing/index.html`:

1. Consent bar HTML added before `</body>`
2. Consent bar CSS added to the existing `<style>` block
3. GA stub + consent default added to `<head>` (no network request)
4. Analytics JS (consent logic + event tracking) added to the existing `<script>` block — after the existing form submission logic

No new files. No build step. No external dependencies beyond `gtag.js` (loaded dynamically after consent only).

---

## Out of Scope

- Scroll depth tracking
- Time on page
- Traffic source breakdown (GA4 handles automatically)
- Session recording or heatmaps
- Privacy/cookie policy page
- Google Fonts consent (separate concern)
