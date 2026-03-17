# Jarv-ID.com Landing Page — Design Spec

**Date:** 2026-03-16
**Status:** Approved

---

## Overview

A single-page marketing website hosted at Jarv-ID.com. Its purpose is to generate qualified inbound leads from UK venue operators (pub/bar, nightclub, 18+ venue, hotel/hospitality) who are interested in installing a Jarvid self-service vape kiosk.

The primary conversion action is submitting a demo request form with enough detail to qualify the lead before a follow-up call.

---

## Audience

**Primary:** Venue operators — owners or managers of UK licensed premises who sell or want to sell vaping products. Target venue types: pub/bar, nightclub, 18+ venue, hotel/hospitality.

**Not targeted:** End consumers, vape shops, convenience stores.

---

## Layout

**Split Hero** (above the fold):
- Left column: headline, subtext, proof stats
- Right column: static demo request form, fully visible on page load

The form does not scroll or follow the viewport — it is positioned within the hero section. The fixed nav contains a "Book a Demo" CTA that anchors back to the form. A footer CTA section also anchors back to the form.

---

## Sections (top to bottom)

### 1. Fixed Navigation
- Logo: `JARV-ID` styled in Bebas Neue (white body, amber `-ID`)
- Right: "Book a Demo" amber CTA — rendered as an `<a href="#form">` anchor styled as a button (not a `<button>` element), so it scrolls to the form without JavaScript

### 2. Hero — Left Column
- Eyebrow pill: "Now accepting venue partners" with amber dot
- Headline (Bebas Neue, large): "SELL SMARTER. / STAY COMPLIANT. / DO LESS." (COMPLIANT in amber)
- Subtext: "JARV-ID is the self-service vape kiosk built for UK venues. Automated age verification, real-time stock control and zero staff burden in one sleek unit." ("JARV-ID" rendered as inline logo mark)
- Proof stats row (3 stats): "100% Age-verified sales", "24/7 Always ready to sell", "5 min Daily management"

### 3. Hero — Right Column (Demo Form)
Form title: "BOOK A DEMO"
Form subtitle: "Tell us about your venue and we'll be in touch within 24 hours."

Fields (all mandatory, marked with amber asterisk):
- First Name / Last Name (2-col grid)
- Business Name
- Venue Type (select): Pub / Bar, Nightclub, 18+ Venue, Hotel / Hospitality, Other
- No. of Sites / Postcode (2-col grid)
  - Postcode label dynamically changes to "HQ Postcode" when No. of Sites > 1
  - Placeholder also updates: "Head office postcode" when multi-site
- Email
- Phone

Submit: `<button type="submit">` with label "REQUEST DEMO" (Bebas Neue, amber background)
Footer note: "No commitment. We'll call to understand your needs first."

### 4. Features
- Small eyebrow label above the section title: "Why JARV-ID" (using the inline logo mark, 15px, amber, uppercase, letter-spacing 0.12em)
- Section title (Bebas Neue, large): "EVERYTHING YOUR VENUE NEEDS"

Three equal-width cards, each with:
- SVG line icon (amber, 22px, in a 48px rounded icon box)
- Card title (Bebas Neue)
- Description paragraph
- Bullet list of specific capabilities

Cards:

1. **COMPLIANCE BUILT IN** (Shield icon)
   Body: "Every sale is age-verified before it happens. Multiple verification methods, full audit trails and automatic refusal keep you covered, always."
   Bullets: Yoti digital ID / AI camera estimation / Passport & driving licence scan / Full compliance logs, exportable

2. **GROW YOUR REVENUE** (TrendingUp icon)
   Body: "Self-service removes the bottleneck. Customers browse, pick and pay without waiting for staff, increasing throughput and basket size."
   Bullets: Upsell prompts at checkout / Frees staff for higher-value tasks / Handles peak demand without queues / Card & contactless payments

3. **EFFORTLESS MANAGEMENT** (LayoutDashboard icon)
   Body: "One dashboard for all your venues. Live stock levels, daily sales and kiosk status visible from your phone, tablet or desktop."
   Bullets: Multi-venue, single dashboard / Real-time stock alerts / Daily sales & trend reports / Remote kiosk monitoring

### 5. How It Works
- Eyebrow label: "How it works" (same style as Features eyebrow — 15px, amber, uppercase, letter-spacing 0.12em)
- Section title (Bebas Neue, large): "UP AND RUNNING IN DAYS"

Four numbered steps in a 4-column grid:
1. **Book a demo** — "We visit your venue (or do a video call) to understand your setup and confirm fit."
2. **We install the kiosk** — "Our team handles delivery, installation and configuration. Zero disruption to your operation."
3. **Stock & go live** — "We load your product catalogue, you stock the unit, and it starts selling the same day."
4. **Manage from anywhere** — "Monitor sales, stock and compliance from your phone. We're on hand if you ever need us."

### 6. Footer CTA
- Headline: "READY TO ADD A JARV-ID?" (inline logo mark)
- Subtext: "Join the growing number of UK venues selling smarter."
- Amber CTA anchor (styled as button), label: "Book Your Demo", anchors to `#form`

### 7. Footer
Single horizontal row (`justify-content: space-between`):
- Left: JARV-ID logo mark (Bebas Neue 20px)
- Centre: "© 2026 Jarvid Ltd. All rights reserved."
- Right: "jarv-id.com"

Note: the nav CTA reads "Book a Demo" and the footer CTA reads "Book Your Demo" — this is intentional, not a typo.

---

## Visual Design

**Aesthetic:** Dark, elevated, premium/minimal. Similar tonal palette to the Jarvid app but less "kiosk UI" — cleaner spacing, more whitespace, more restrained.

**Colours:**
- Background: `#09090b`
- Surface: `#111113`
- Card: `#18181b`
- Border: `#27272a` / `#3f3f46`
- Accent (amber): `#f0a830`
- Accent glow: `rgba(240,168,48,0.12)` — used as background fill on feature icon boxes
- Text: `#fafaf9`
- Text subdued: `#a1a1aa`
- Text muted: `#52525b`

**Typography:**
- Display / headings: Bebas Neue (Google Fonts)
- Body: Outfit, weights 300/400/500/600/700 (Google Fonts)
- No monospace font needed on the landing page

**Icons:** Inline SVG line icons (stroke-width 1.5, stroke-linecap/linejoin round). No emoji.

**Logo mark:** `JARV-ID` — Bebas Neue, white for "JARV", amber (`#f0a830`) for "-ID". Used in nav, footer, and inline within body copy via `.inline-logo` span.
- Nav / footer logo: letter-spacing `0.08em`, font-size 28px (nav) / 20px (footer)
- Inline body copy logo: letter-spacing `0.06em`, font-size inherits from parent element

---

## Copy Rules

- No em dashes (`—`). Use commas, full stops, or reworded constructions instead.
- No emoji anywhere on the page.
- Avoid claims that are not strictly accurate (e.g. "operates 24/7 unattended" — replaced with "Frees staff for higher-value tasks").
- "JARV-ID" (logo mark) replaces the word "Jarvid" wherever it appears in visible body copy.

---

## Form Behaviour

- All fields are `required`
- Asterisks (`*`) in amber denote mandatory fields
- Postcode label: JS listener on "No. of Sites" input. If value > 1, label becomes "HQ Postcode" and placeholder becomes "Head office postcode". Reverts on change back to 1 or empty.
- Form has `novalidate` — validation behaviour to be implemented in the build phase

---

## Tech Stack

The landing page is a **standalone static HTML file** — no React, no Vite, no build step. It can be deployed directly to any static host (Vercel, Netlify, Cloudflare Pages) at Jarv-ID.com.

Dependencies loaded from CDN:
- Google Fonts (Bebas Neue, Outfit)
- No JavaScript libraries

**Form submission flow:**
1. User submits the form
2. A `fetch` POST sends the data to a Supabase Edge Function (`submit-demo-request`)
3. The Edge Function inserts a row into a `demo_requests` table in Supabase and sends a notification email to `sales@jarv-id.com` via Resend (or Supabase's built-in email)
4. On success, the form is replaced with a confirmation message: "Thanks — we'll be in touch within 24 hours."
5. On error, an inline error message is shown beneath the submit button

**`demo_requests` table columns:** id, created_at, first_name, last_name, business_name, venue_type, num_sites, postcode, email, phone

---

## Out of Scope

- Mobile/responsive layout (to be addressed in a follow-up)
- Confirmation email to the submitter (only a notification to sales@jarv-id.com is in scope)
- Analytics / tracking scripts
- Cookie/GDPR banner
- Adding the JARV-ID logo to the main Jarvid app (noted for a separate task)
