# Landing Page Analytics Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GA4 analytics with a GDPR-compliant cookie consent bar to `landing/index.html`.

**Architecture:** All changes confined to `landing/index.html`. A gtag stub in `<head>` initialises consent as denied with no network requests. The consent bar (HTML + CSS) is added at the bottom of the page. Analytics JS handles accept/decline, dynamic GA script injection, and form event tracking. The existing form submit handler is modified minimally to fire tracking events.

**Tech Stack:** Google Analytics 4 (`gtag.js`), vanilla JS, `localStorage`

**Spec:** `docs/superpowers/specs/2026-03-17-landing-analytics-design.md`

---

## File Map

| File | Change |
|---|---|
| `landing/index.html` (lines 3–256) | Add gtag stub before `</head>` |
| `landing/index.html` (lines 8–255) | Add consent bar CSS to existing `<style>` block |
| `landing/index.html` (line 525) | Add consent bar HTML before `</body>` |
| `landing/index.html` (lines 459–523) | Add analytics JS after existing script; modify form submit handler |

---

## Chunk 1: Consent Bar + GA Initialisation

### Task 1: Add gtag stub to `<head>` and consent bar CSS + HTML

**Files:**
- Modify: `landing/index.html:254` (add before `</style>`)
- Modify: `landing/index.html:256` (add before `</head>`)
- Modify: `landing/index.html:525` (add before `</body>`)

- [ ] **Step 1: Add consent bar CSS**

Open `landing/index.html`. Find `</style>` at line 255. Insert the following **before** `</style>`:

```css
  /* CONSENT BAR */
  #consent-bar {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
    background: #131110; border-top: 1px solid var(--border);
    padding: 16px 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    font-family: var(--font-body); font-size: 13px; color: var(--text-sub);
  }
  #consent-bar p { flex: 1; margin: 0; }
  .consent-btn-accept {
    padding: 8px 20px; border-radius: 6px;
    background: var(--accent); color: #09090b;
    font-weight: 700; font-size: 13px; border: none; cursor: pointer;
    white-space: nowrap; flex-shrink: 0;
  }
  .consent-btn-decline {
    padding: 8px 16px; border-radius: 6px;
    background: transparent; border: 1px solid var(--text-muted);
    color: var(--text-muted); font-size: 13px; cursor: pointer;
    white-space: nowrap; flex-shrink: 0;
  }
  .consent-btn-accept:hover { opacity: 0.9; }
  .consent-btn-decline:hover { border-color: var(--text-sub); color: var(--text-sub); }
  @media (max-width: 600px) {
    #consent-bar { flex-direction: column; align-items: flex-start; }
  }
```

- [ ] **Step 2: Add gtag stub to `<head>`**

Find `</head>` at line 256. Insert the following **before** `</head>`:

```html
<!-- Google Analytics — consent stub (no network requests until user accepts) -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('consent', 'default', { analytics_storage: 'denied' });
</script>
```

- [ ] **Step 3: Add consent bar HTML**

Find `</body>` near the end of the file. Insert the following **before** `</body>`:

```html
<div id="consent-bar" style="display:none">
  <p>We use cookies to understand how visitors use this site and improve it. No data is shared or sold.</p>
  <button class="consent-btn-decline" id="consentDecline">Decline</button>
  <button class="consent-btn-accept" id="consentAccept">Accept</button>
</div>
```

- [ ] **Step 4: Verify bar renders correctly**

Open `landing/index.html` in Chrome (you can use `open landing/index.html` or drag it into a browser tab — no server needed for this visual check).

Temporarily change `style="display:none"` on `#consent-bar` to `style="display:flex"` in the file. Reload.

Expected: A slim dark bar appears pinned to the bottom with amber Accept button and muted Decline button. Layout looks correct on both wide and narrow windows.

Revert the `display` attribute back to `none` after checking.

- [ ] **Step 5: Commit**

```bash
git add landing/index.html
git commit -m "feat: add consent bar HTML/CSS and gtag stub to landing page"
```

---

### Task 2: Add consent logic JS inside the existing `<script>` block (before `</script>` at line 523)

**Files:**
- Modify: `landing/index.html:522` (insert after line 522, before `</script>` at line 523 — do NOT add a new `<script>` tag)

- [ ] **Step 1: Add analytics + consent JS**

Find the `</script>` tag at line 523. Insert the following block **before** `</script>`:

```js
  // ── Analytics & Consent ──────────────────────────────────────
  const GA_MEASUREMENT_ID = "G-RGMN0H2MPB";
  const CONSENT_KEY = "jarv_analytics_consent";

  let analyticsEnabled = false;

  function loadGA() {
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('config', GA_MEASUREMENT_ID);
    analyticsEnabled = true;
  }

  function trackEvent(name, params) {
    if (!analyticsEnabled) return;
    gtag('event', name, params || {});
  }

  // Initialise consent state on page load
  (function initConsent() {
    let stored = null;
    try { stored = localStorage.getItem(CONSENT_KEY); } catch(e) {}
    if (stored === 'granted') {
      loadGA();
    } else if (stored !== 'denied') {
      document.getElementById('consent-bar').style.display = 'flex';
    }
  })();

  document.getElementById('consentAccept').addEventListener('click', function() {
    try { localStorage.setItem(CONSENT_KEY, 'granted'); } catch(e) {}
    document.getElementById('consent-bar').style.display = 'none';
    loadGA();
  });

  document.getElementById('consentDecline').addEventListener('click', function() {
    try { localStorage.setItem(CONSENT_KEY, 'denied'); } catch(e) {}
    document.getElementById('consent-bar').style.display = 'none';
  });
```

- [ ] **Step 2: Test — bar appears on fresh visit**

Open Chrome DevTools. Go to Application → Local Storage → file:// (or the live URL). Delete the `jarv_analytics_consent` key if it exists.

Reload the page.

Expected: Consent bar appears at the bottom.

- [ ] **Step 3: Test — Decline hides bar, GA does not load**

Click **Decline**.

Expected:
- Bar disappears
- DevTools Network tab shows NO request to `googletagmanager.com`
- Application → Local Storage shows `jarv_analytics_consent = "denied"`

Reload the page. Expected: bar does not reappear.

- [ ] **Step 4: Test — Accept loads GA**

Delete `jarv_analytics_consent` from Local Storage. Reload.

Click **Accept**.

Expected:
- Bar disappears
- DevTools Network tab shows a request to `https://www.googletagmanager.com/gtag/js?id=G-RGMN0H2MPB`
- Application → Local Storage shows `jarv_analytics_consent = "granted"`

Reload the page. Expected: bar does not reappear and GA loads immediately (network request appears without clicking Accept).

- [ ] **Step 5: Commit**

```bash
git add landing/index.html
git commit -m "feat: add consent logic and GA dynamic loading"
```

---

## Chunk 2: Form Event Tracking

### Task 3: Add form event tracking

**Files:**
- Modify: `landing/index.html:482–521` (existing form submit handler)
- Modify: `landing/index.html:523` (add before `</script>`)

- [ ] **Step 1: Add tracking flags and field listeners**

Find the analytics section added in Task 2 (the `trackEvent` function block). Add the following **after** the `consentDecline` click listener and **before** `</script>`:

```js
  // ── Form event tracking ──────────────────────────────────────
  let formStarted = false;
  let formSubmitSuccess = false;

  const trackedFields = ['first_name','last_name','business_name','venue_type','num_sites','postcode','email','phone'];

  trackedFields.forEach(function(fieldName) {
    const el = form.querySelector('[name="' + fieldName + '"]');
    if (!el) return;

    el.addEventListener('focus', function onFirstFocus() {
      if (!formStarted) {
        formStarted = true;
        trackEvent('form_start');
      }
    });

    el.addEventListener('blur', function() {
      const val = el.value != null ? el.value.toString().trim() : '';
      if (val !== '') {
        trackEvent('form_field_complete', { field_name: fieldName });
      }
    });
  });

  window.addEventListener('beforeunload', function() {
    if (formStarted && !formSubmitSuccess) {
      trackEvent('form_abandon');
    }
  });
```

- [ ] **Step 2: Modify existing form submit handler to fire tracking events**

The existing form submit handler lives from line 482. Make the following targeted additions:

**Add `form_submit_attempt` after the `formError.style.display = "none"` line:**

Find this exact block:
```js
    submitBtn.disabled = true;
    submitBtn.textContent = "SENDING…";
    formError.style.display = "none";
```

Replace with:
```js
    submitBtn.disabled = true;
    submitBtn.textContent = "SENDING…";
    formError.style.display = "none";
    trackEvent('form_submit_attempt');
```

**Add `formSubmitSuccess` flag and `form_submit_success` event before the DOM replacement on success:**

Find this exact block:
```js
      if (!res.ok || !json.success) throw new Error(json.error || "Unexpected error");

      formWrap.querySelector("form").replaceWith(
```

Replace with:
```js
      if (!res.ok || !json.success) throw new Error(json.error || "Unexpected error");

      formSubmitSuccess = true;
      trackEvent('form_submit_success');
      formWrap.querySelector("form").replaceWith(
```

**Add `form_submit_error` event in the catch block:**

Find this exact block:
```js
    } catch (err) {
      formError.textContent = "Something went wrong. Please try again or email sales@jarv-id.com.";
```

Replace with:
```js
    } catch (err) {
      trackEvent('form_submit_error');
      formError.textContent = "Something went wrong. Please try again or email sales@jarv-id.com.";
```

- [ ] **Step 3: Enable GA4 DebugView**

In Chrome, install the [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) extension, or open DevTools Console — GA4 events will be logged there when `analyticsEnabled` is true.

Alternatively: in GA4 dashboard → Admin → DebugView. Events from your browser appear in real time when the `debug_mode` parameter is set. For a quick check, the Console approach is sufficient.

- [ ] **Step 4: Test form events**

1. Delete `jarv_analytics_consent` from Local Storage. Reload.
2. Accept cookies.
3. Click into the **First Name** field (don't type yet).
   Expected in Console: `form_start` event logged.
4. Type a name, then tab out.
   Expected: `form_field_complete` with `field_name: "first_name"`.
5. Fill in all other fields and tab through them.
   Expected: `form_field_complete` fires for each field on blur.
6. Click **Request Demo**.
   Expected: `form_submit_attempt` event.
7. On success: `form_submit_success` event.

To test `form_abandon`: start filling the form, then close the tab. Check GA4 DebugView (events may be delayed by up to 30 seconds).

To test `form_submit_error`: temporarily change `FUNCTION_URL` to a bad URL, submit, revert.

- [ ] **Step 5: Commit**

```bash
git add landing/index.html
git commit -m "feat: add GA4 form event tracking to landing page"
```

---

## Final Step: Deploy

- [ ] **Deploy to Vercel**

From the `landing/` directory:

```bash
npx vercel@latest --prod
```

Expected: deployment succeeds and https://jarv-id.com shows the updated page with the consent bar.

- [ ] **Smoke test on live site**

Open https://jarv-id.com in an incognito window (to ensure no stored consent).

Expected: consent bar appears at the bottom. Accept → bar disappears, GA loads (check Network tab).
