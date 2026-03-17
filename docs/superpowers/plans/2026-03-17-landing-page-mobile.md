# Landing Page Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `landing/index.html` fully usable on all mobile devices from 375px width upward.

**Architecture:** Single-file HTML/CSS/JS change. The hero is restructured from a 2-column grid (headline | form) to a full-width centered layout; the form card is moved to its own section after "How It Works". Responsive breakpoints at 768px and 480px cover all remaining sections.

**Tech Stack:** Plain HTML, CSS (media queries), vanilla JS — no build system, no framework.

---

### Task 1: Restructure the Hero Section HTML

This is a pure HTML change — no CSS yet. The goal is to move the form out of the hero and into its own section, and add a CTA button to the hero.

**Files:**
- Modify: `landing/index.html`

- [ ] **Step 1: Move the form out of the hero**

Find the `<section class="hero">` block. Inside it there are two children: `<div class="hero-left">` and `<div class="hero-form-wrap" id="form">`.

Remove `<div class="hero-form-wrap" id="form">...</div>` entirely from the hero section.

The hero section should now contain only `<div class="hero-left">`.

- [ ] **Step 2: Add a CTA button to the hero**

Inside `.hero-left`, after the `<p class="hero-sub">` paragraph and before the `<div class="hero-proof">` div, insert:

```html
<a href="#form" class="hero-cta-btn">BOOK A DEMO ↓</a>
```

- [ ] **Step 3: Create the form section**

After the closing `</section>` of the `.how` section (around line 479) and before `<!-- FOOTER CTA -->`, insert:

```html
<!-- FORM SECTION -->
<section class="form-section" id="form">
  <div class="form-section-inner">
    <p class="form-section-label">Get Started</p>
    <h2 class="form-section-title">BOOK YOUR DEMO</h2>
    <p class="form-section-sub">Tell us about your venue and we'll be in touch within 24 hours.</p>
    <div class="hero-form-wrap">

      <form id="demoForm" novalidate>
        <div class="form-grid">
          <div class="form-row">
            <label>First Name <span class="req">*</span></label>
            <input type="text" name="first_name" placeholder="John" required>
          </div>
          <div class="form-row">
            <label>Last Name <span class="req">*</span></label>
            <input type="text" name="last_name" placeholder="Smith" required>
          </div>
        </div>

        <div class="form-row">
          <label>Business Name <span class="req">*</span></label>
          <input type="text" name="business_name" placeholder="The Crown" required>
        </div>

        <div class="form-row">
          <label>Venue Type <span class="req">*</span></label>
          <select name="venue_type" required>
            <option value="">Select venue type…</option>
            <option>Pub / Bar</option>
            <option>Nightclub</option>
            <option>18+ Venue</option>
            <option>Hotel / Hospitality</option>
            <option>Other</option>
          </select>
        </div>

        <div class="form-grid">
          <div class="form-row">
            <label id="numSitesLabel">No. of Sites <span class="req">*</span></label>
            <input type="number" id="numSites" name="num_sites" placeholder="1" min="1" required>
          </div>
          <div class="form-row">
            <label id="postcodeLabel">Postcode <span class="req">*</span></label>
            <input type="text" id="postcodeInput" name="postcode" placeholder="M1 1AA" required>
          </div>
        </div>

        <div class="form-row">
          <label>Email <span class="req">*</span></label>
          <input type="email" name="email" placeholder="john@thevenue.co.uk" required>
        </div>

        <div class="form-row">
          <label>Phone <span class="req">*</span></label>
          <input type="tel" name="phone" placeholder="+44 7700 900000" required>
        </div>

        <button type="submit" class="form-submit" id="submitBtn">REQUEST DEMO</button>
        <p id="formError" style="display:none;color:#e5433a;font-size:13px;text-align:center;margin-top:10px;"></p>
        <p class="form-note">No commitment. We'll call to understand your needs first.</p>
      </form>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Open the page and verify the HTML structure**

Open `landing/index.html` directly in a browser (or via `npx serve landing`). Confirm:
- The hero section shows: eyebrow → headline → subtitle → "BOOK A DEMO ↓" button → stats
- Clicking "BOOK A DEMO ↓" (or the nav "Book a Demo" button) scrolls to the form
- The form section appears between "How It Works" and the "Ready to Add" footer CTA
- The form submits successfully (check network tab for the Supabase function call)

- [ ] **Step 5: Commit**

```bash
git add landing/index.html
git commit -m "refactor: move demo form out of hero into its own section"
```

---

### Task 2: Update Desktop CSS for the New Hero Layout

The hero CSS currently assumes a 2-column grid. Update it to centered single-column, and add styles for the new CTA button and form section.

**Files:**
- Modify: `landing/index.html` (the `<style>` block)

- [ ] **Step 1: Replace the hero grid rule**

Find and replace the entire `.hero` rule:

```css
/* OLD */
.hero {
  min-height: 100vh;
  padding-top: 64px;
  display: grid;
  grid-template-columns: 1fr 480px;
  max-width: 1280px; margin: 0 auto; padding-inline: 48px;
  gap: 64px;
  align-items: center;
}
```

Replace with:

```css
.hero {
  min-height: 100vh;
  padding-top: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-inner {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 80px 48px;
  text-align: center;
}
```

Then wrap the `<div class="hero-left">` in the HTML with `<div class="hero-inner">`:

```html
<section class="hero">
  <div class="hero-inner">
    <div class="hero-left">
      ...
    </div>
  </div>
</section>
```

- [ ] **Step 2: Fix `.hero-left` and `.hero-sub`**

Find `.hero-left { padding: 80px 0; }` — remove it (padding now lives on `.hero-inner`).

Find `.hero-sub { font-size: 18px; color: var(--text-sub); font-weight: 300; max-width: 480px; margin-bottom: 40px; line-height: 1.7; }` and change `max-width: 480px` to `max-width: 600px; margin-left: auto; margin-right: auto;`.

- [ ] **Step 3: Center the hero-eyebrow and hero-proof**

`.hero-eyebrow` uses `display: inline-flex` — works fine centered.

`.hero-proof` uses `display: flex; gap: 32px` — add `justify-content: center`.

- [ ] **Step 4: Add hero CTA button styles**

Add after `.hero-sub`:

```css
.hero-cta-btn {
  display: inline-block;
  padding: 16px 40px;
  background: var(--accent);
  color: #09090b;
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: 0.08em;
  border-radius: 10px;
  text-decoration: none;
  box-shadow: 0 4px 24px rgba(240,168,48,0.3);
  margin-bottom: 40px;
  transition: all 0.15s;
}
.hero-cta-btn:hover {
  background: #f5b840;
  box-shadow: 0 6px 32px rgba(240,168,48,0.45);
}
```

- [ ] **Step 5: Add form section styles**

Add after the existing `.form-note` rule:

```css
/* FORM SECTION */
.form-section {
  background: var(--surface);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 100px 48px;
}
.form-section-inner {
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
}
.form-section-label {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 16px;
}
.form-section-title {
  font-family: var(--font-display);
  font-size: clamp(36px, 4vw, 56px);
  letter-spacing: 0.03em;
  margin-bottom: 12px;
  line-height: 1;
}
.form-section-sub {
  font-size: 16px;
  color: var(--text-sub);
  margin-bottom: 32px;
}
.form-section .hero-form-wrap {
  text-align: left;
}
```

- [ ] **Step 6: Verify desktop layout looks correct**

Open the page at a wide viewport (1280px). Confirm:
- Hero is centered, headline large and prominent, CTA button visible
- Form section sits cleanly between "How It Works" and the footer CTA
- No layout regressions in features, steps, footer sections

- [ ] **Step 7: Commit**

```bash
git add landing/index.html
git commit -m "style: redesign hero to full-width centered layout, add form section"
```

---

### Task 3: Add Mobile Breakpoints

Add all responsive CSS in one block at the end of the `<style>` tag, ordered from widest to narrowest breakpoint.

**Files:**
- Modify: `landing/index.html` (the `<style>` block — append before `</style>`)

- [ ] **Step 1: Add the 768px breakpoint block**

Append to the `<style>` block:

```css
/* ── MOBILE — 768px ──────────────────────────────────────── */
@media (max-width: 768px) {
  nav {
    padding: 0 20px;
  }

  .hero-inner {
    padding: 60px 20px 40px;
  }

  .hero-cta-btn {
    display: block;
    width: 100%;
    text-align: center;
  }

  .hero-proof {
    flex-wrap: wrap;
    gap: 20px;
  }

  .features {
    padding: 60px 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .how {
    padding: 60px 20px;
  }

  .steps {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }

  .form-section {
    padding: 60px 20px 80px; /* extra bottom padding clears consent bar */
  }

  .footer-cta {
    padding: 60px 20px;
  }

  footer {
    flex-direction: column;
    text-align: center;
    gap: 8px;
    padding: 24px 20px;
  }
}
```

- [ ] **Step 2: Add the 480px breakpoint block**

Append after the 768px block:

```css
/* ── MOBILE — 480px (small phones) ──────────────────────── */
@media (max-width: 480px) {
  .steps {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .hero-proof {
    justify-content: center;
  }
}
```

- [ ] **Step 3: Ensure all touch targets are ≥ 44px**

The existing `.form-row input, .form-row select` have `padding: 12px 16px` — at 15px font-size that gives ~41px height. Change the padding to `13px 16px` to reach 44px. Find the rule:

```css
.form-row input, .form-row select {
  width: 100%; padding: 12px 16px;
```

Change to `padding: 13px 16px`.

The `.form-submit` has `padding: 16px` — already ≥ 44px. The `.nav-cta` has `padding: 10px 24px` — at 14px font ~36px, acceptable for a nav button (not a primary form input).

- [ ] **Step 4: Check hero headline minimum size**

The `.hero-headline` uses `font-size: clamp(52px, 6vw, 88px)`. At 375px wide, `6vw = 22.5px`, so the clamp floor of 52px kicks in — this is fine. No extra rule needed.

- [ ] **Step 5: Verify at multiple viewports**

Resize browser to these widths and check each one:
- **1280px**: Desktop layout, hero centered, form section clean
- **768px**: Nav compact, hero CTA full-width, features 1-col, steps 2-col, form padding correct
- **480px**: Steps 1-col, form grid fields stacked (first/last name on separate rows, sites/postcode on separate rows)
- **375px**: No horizontal scrollbar, all text legible, form usable

- [ ] **Step 6: Commit**

```bash
git add landing/index.html
git commit -m "style: add responsive breakpoints for mobile (768px, 480px)"
```

---

### Task 4: Verify the Complete Page End-to-End

Final check across the whole page before declaring done.

**Files:**
- Read-only verification

- [ ] **Step 1: Test the form submission on mobile viewport**

At 390px width, fill in and submit the demo form. Confirm:
- All fields are reachable (no content hidden behind consent bar or fixed nav)
- Submit button is tappable
- Success state ("YOU'RE ON THE LIST") renders correctly inside the form card

- [ ] **Step 2: Test all internal links**

- Nav "Book a Demo" → scrolls to form ✓
- Hero "BOOK A DEMO ↓" → scrolls to form ✓
- Footer CTA "Book Your Demo" → scrolls to form ✓

- [ ] **Step 3: Check no horizontal overflow at 375px**

In browser devtools, add `* { outline: 1px solid red }` temporarily to confirm no element bleeds outside the viewport.

- [ ] **Step 4: Final commit**

```bash
git add landing/index.html
git commit -m "fix: verify mobile layout complete, all links and form functional"
```

(Only commit if there were any last-minute fixes. Otherwise skip — previous commits are sufficient.)
