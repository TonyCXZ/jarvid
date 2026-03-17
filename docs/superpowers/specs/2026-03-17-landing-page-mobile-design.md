# Landing Page Mobile Responsiveness — Design Spec

**Date:** 2026-03-17
**Status:** Approved

## Overview

Make `landing/index.html` fully usable on mobile devices (phones from 375px width up). The page currently has a desktop-only layout with no responsive breakpoints except the consent bar.

## Design Decisions

### Hero Layout
- **Desktop**: Restructured from 2-column (headline | form) to full-width centered single column. Headline, subtitle, amber CTA button ("BOOK A DEMO ↓"), stats row. Wider and more impactful than the fixed-480px sidebar layout.
- **Mobile**: Same centered layout, just scaled down. The CTA button scrolls to the form section.

### Form Placement
- Moved from inside `.hero` to its own `<section id="form">` between "How It Works" and the footer CTA.
- Full-width centered card on both desktop and mobile.
- The `#form` anchor already used by nav CTA and footer links continues to work.

### Breakpoints
- `768px` — primary mobile breakpoint (phones and small tablets in portrait)
- `480px` — small phones (iPhone SE, Galaxy A-series)

## Sections — Changes Required

### HTML Restructure
1. Remove `<div class="hero-form-wrap" id="form">` from inside `.hero`
2. Remove `grid-template-columns: 1fr 480px` from `.hero` — replace with centered flex/block
3. Add a new `<section class="form-section" id="form">` after `.how` and before `.footer-cta`, containing the form card

### CSS Changes

**Nav** (768px):
- `padding: 0 20px` (was 48px)

**Hero** (desktop — all screens):
- Change from CSS grid to centered block layout
- `text-align: center` on hero content
- `max-width: 720px; margin: 0 auto` on hero text block
- CTA button (new element): amber, full-width on mobile
- Stats row: keep flex, allow wrap on mobile

**How It Works** (768px):
- `padding: 60px 20px` (was `100px 48px`)

**Hero** (768px):
- `padding-bottom: 60px` (was `80px` on `.hero-left`)
- `hero-headline` font-size floor: 40px

**Features** (768px):
- `grid-template-columns: 1fr` (was `repeat(3, 1fr)`)
- `padding: 60px 20px` (was `120px 48px`)

**Features** (600px):
- Nothing extra needed — already 1-col

**Steps / How It Works** (768px):
- `grid-template-columns: 1fr 1fr` (was `repeat(4, 1fr)`)

**Steps** (480px):
- `grid-template-columns: 1fr`

**Form Section** (new, desktop):
- `max-width: 560px; margin: 0 auto`
- Section heading above card: "BOOK A DEMO" label + subtext
- Padding: `80px 48px`

**Form Section** (768px):
- `padding: 60px 20px`

**Footer CTA** (768px):
- `padding: 60px 20px`
- Font size reduced

**Footer** (768px):
- `flex-direction: column; text-align: center; gap: 8px`
- `padding: 24px 20px`

**Form grid** (480px):
- `grid-template-columns: 1fr` (first/last name stacked rather than side by side)

### JavaScript
No changes to logic. One dependency to verify: the success-state handler does `document.getElementById("form").querySelector("form").replaceWith(...)`. After the restructure `id="form"` moves to the wrapping `<section>`, but the `<form>` element remains a descendant, so `querySelector("form")` still resolves correctly. No code change needed.

### New Hero CTA Button
- Element: `<a href="#form" class="hero-cta-btn">BOOK A DEMO ↓</a>`
- Placed after `.hero-sub`, before `.hero-proof`
- Desktop: `display: inline-block`, `padding: 16px 40px`, amber background, dark text, same style as `.nav-cta` but larger
- Mobile: `display: block; width: 100%`

### `.hero-sub` Width Fix
Remove the existing `max-width: 480px` on `.hero-sub`. In the new centered layout it should be `max-width: 600px; margin: 0 auto`.

### Nav Offset Preserved
`.hero` keeps `padding-top: 64px` to clear the fixed nav. Only `grid-template-columns` is removed and replaced with `max-width: 800px; margin: 0 auto; text-align: center`.

### Both Form Grids Collapse
`.form-grid` at 480px uses `grid-template-columns: 1fr` — this rule applies to both the first/last name row and the sites/postcode row. Intentional: both rows stack on small phones.

### Consent Bar Overlap
The fixed consent bar may obscure the bottom of the form when visible. The form section gets `padding-bottom: 80px` on mobile (instead of 60px) to ensure the submit button and form note clear the consent bar (~80px tall on mobile).

## Success Criteria
- Page renders correctly at 375px, 390px, 414px, 768px, and 1280px widths
- No horizontal scrollbar at any width
- Form is reachable via the nav CTA button and in-page links on all devices
- All text is legible (no overflow, no tiny font sizes)
- Touch targets (buttons, inputs) are ≥ 44px tall on mobile
