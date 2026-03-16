# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a standalone marketing landing page at Jarv-ID.com that captures demo requests into Supabase and emails sales@jarv-id.com on each submission.

**Architecture:** A fully self-contained static HTML file (`landing/index.html`) with no build step or framework dependency, served from a static host. Form submissions POST to a Supabase Edge Function that inserts the lead into a `demo_requests` table and sends a notification email via Resend.

**Tech Stack:** HTML/CSS/Vanilla JS, Supabase Edge Functions (Deno/TypeScript), Supabase Postgres, Resend (email), Vercel (static hosting)

---

## Chunk 1: Supabase — Database Table + Edge Function

### Task 1: Create the `demo_requests` migration

**Files:**
- Create: `supabase/migrations/20260316000000_create_demo_requests.sql`

- [ ] **Step 1.1: Initialise the Supabase migrations folder**

```bash
cd /Users/tony/jarvid
supabase migration new create_demo_requests
```

Expected: creates `supabase/migrations/20260316XXXXXX_create_demo_requests.sql`

Rename it to the fixed timestamp so it's deterministic:
```bash
mv supabase/migrations/*create_demo_requests.sql supabase/migrations/20260316000000_create_demo_requests.sql
```

- [ ] **Step 1.2: Write the migration**

Replace the file contents with:

```sql
create table public.demo_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  first_name   text not null,
  last_name    text not null,
  business_name text not null,
  venue_type   text not null,
  num_sites    integer not null,
  postcode     text not null,
  email        text not null,
  phone        text not null
);

-- Only the service role can read/write (submissions go through the edge function).
-- The service role bypasses RLS by design — no policies are needed.
alter table public.demo_requests enable row level security;
```

- [ ] **Step 1.3: Push the migration to the remote Supabase project**

```bash
supabase db push
```

This pushes to the remote project (not a local instance). Expected output: migration applied with no errors. If you see a "no linked project" error, run `supabase link --project-ref kidyoplpqmvebujypndu` first.

- [ ] **Step 1.4: Verify the table exists**

Check via Supabase dashboard: Table Editor → `demo_requests` should be visible with all 10 columns (id, created_at, first_name, last_name, business_name, venue_type, num_sites, postcode, email, phone).

- [ ] **Step 1.5: Commit**

```bash
git add supabase/migrations/20260316000000_create_demo_requests.sql
git commit -m "feat: add demo_requests table migration"
```

---

### Task 2: Create the Edge Function

**Files:**
- Create: `supabase/functions/submit-demo-request/index.ts`

**What this function does:**
1. Validates the request method (POST only)
2. Parses and validates the JSON body
3. Inserts a row into `demo_requests`
4. Sends a notification email to `sales@jarv-id.com` via Resend
5. Returns JSON `{ success: true }` or an error response

**Prerequisites:** You need a Resend account and API key. Sign up at resend.com (free tier: 3,000 emails/month). Store the key as a Supabase secret:
```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
```

- [ ] **Step 2.1: Create the function directory and file**

```bash
mkdir -p supabase/functions/submit-demo-request
```

- [ ] **Step 2.2: Write the Edge Function**

Create `supabase/functions/submit-demo-request/index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NOTIFICATION_EMAIL = "sales@jarv-id.com";

interface DemoRequest {
  first_name: string;
  last_name: string;
  business_name: string;
  venue_type: string;
  num_sites: number;
  postcode: string;
  email: string;
  phone: string;
}

const REQUIRED_FIELDS: (keyof DemoRequest)[] = [
  "first_name", "last_name", "business_name", "venue_type",
  "num_sites", "postcode", "email", "phone",
];

function validateBody(body: unknown): body is DemoRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return REQUIRED_FIELDS.every((field) => {
    const val = b[field];
    if (field === "num_sites") return typeof val === "number" && val >= 1;
    return typeof val === "string" && val.trim().length > 0;
  });
}

async function sendNotificationEmail(req: DemoRequest): Promise<void> {
  const postcodeLabel = req.num_sites > 1 ? "HQ Postcode" : "Postcode";
  const body = `
New demo request received on Jarv-ID.com

Name:          ${req.first_name} ${req.last_name}
Business:      ${req.business_name}
Venue Type:    ${req.venue_type}
No. of Sites:  ${req.num_sites}
${postcodeLabel}:     ${req.postcode}
Email:         ${req.email}
Phone:         ${req.phone}
  `.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Jarv-ID <noreply@jarv-id.com>",
      to: [NOTIFICATION_EMAIL],
      subject: `New demo request: ${req.business_name}`,
      text: body,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: CORS,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: CORS,
    });
  }

  if (!validateBody(body)) {
    return new Response(JSON.stringify({ error: "Missing or invalid fields" }), {
      status: 400,
      headers: CORS,
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error: dbError } = await supabase.from("demo_requests").insert({
    first_name:    body.first_name.trim(),
    last_name:     body.last_name.trim(),
    business_name: body.business_name.trim(),
    venue_type:    body.venue_type,
    num_sites:     body.num_sites,
    postcode:      body.postcode.trim().toUpperCase(),
    email:         body.email.trim().toLowerCase(),
    phone:         body.phone.trim(),
  });

  if (dbError) {
    console.error("DB insert error:", dbError);
    return new Response(JSON.stringify({ error: "Failed to save request" }), {
      status: 500,
      headers: CORS,
    });
  }

  try {
    await sendNotificationEmail(body);
  } catch (emailErr) {
    // DB insert succeeded — log the email failure but don't fail the request
    console.error("Email send error:", emailErr);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: CORS,
  });
});
```

- [ ] **Step 2.3: Serve the function locally**

```bash
supabase functions serve submit-demo-request --env-file .env.local
```

Create `.env.local` if it doesn't exist. Do NOT commit this file — confirm `.env.local` is in `.gitignore` before saving.

All three values are required for local testing. Find them at Supabase dashboard → Project Settings → API:
- `SUPABASE_URL` → "Project URL"
- `SUPABASE_SERVICE_ROLE_KEY` → "service_role secret" (click reveal)
- `RESEND_API_KEY` → your Resend dashboard → API Keys

```
SUPABASE_URL=https://kidyoplpqmvebujypndu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_secret_from_dashboard>
RESEND_API_KEY=<resend_api_key_from_resend_dashboard>
```

Expected: function running at `http://localhost:54321/functions/v1/submit-demo-request`

- [ ] **Step 2.4: Test — valid submission**

```bash
curl -X POST http://localhost:54321/functions/v1/submit-demo-request \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Smith",
    "business_name": "The Crown",
    "venue_type": "Pub / Bar",
    "num_sites": 1,
    "postcode": "M1 1AA",
    "email": "john@thecrown.co.uk",
    "phone": "+44 7700 900000"
  }'
```

Expected response:
```json
{"success": true}
```

Expected side effects: row appears in `demo_requests` table; email arrives at sales@jarv-id.com.

- [ ] **Step 2.5: Test — missing field returns 400**

```bash
curl -X POST http://localhost:54321/functions/v1/submit-demo-request \
  -H "Content-Type: application/json" \
  -d '{"first_name": "John"}'
```

Expected:
```json
{"error": "Missing or invalid fields"}
```
Status: 400.

- [ ] **Step 2.6: Test — wrong method returns 405**

```bash
curl -X GET http://localhost:54321/functions/v1/submit-demo-request
```

Expected:
```json
{"error": "Method not allowed"}
```
Status: 405.

- [ ] **Step 2.7: Deploy the function**

```bash
supabase functions deploy submit-demo-request
```

Then set the Resend secret — substitute your actual key from the Resend dashboard before running (do not run with the placeholder literal):

```bash
# Replace YOUR_KEY with the real value before running
supabase secrets set RESEND_API_KEY=YOUR_KEY
```

Use the same key you added to `.env.local` in Step 2.3. This sets it as a server-side secret on the deployed function and only needs to be run once.

- [ ] **Step 2.8: Smoke-test the deployed function**

Get the project ref from `supabase/.temp/project-ref` (value: `kidyoplpqmvebujypndu`).

Find your anon key at: Supabase dashboard → Project Settings → API → **anon public**. Replace `<SUPABASE_ANON_KEY>` in the command below with that value.

```bash
curl -X POST https://kidyoplpqmvebujypndu.supabase.co/functions/v1/submit-demo-request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "business_name": "Test Venue",
    "venue_type": "Pub / Bar",
    "num_sites": 1,
    "postcode": "SW1A 1AA",
    "email": "test@example.com",
    "phone": "+44 7700 900001"
  }'
```

Expected: `{"success": true}`. Also verify:
- A row appeared in the `demo_requests` table in the Supabase dashboard
- An email arrived at `sales@jarv-id.com` (check inbox/spam — this confirms Resend is wired correctly)

Delete the test row from the dashboard afterwards. If `{"success": true}` was returned but no email arrived, the `RESEND_API_KEY` secret is likely missing or incorrect — re-run Step 2.7.

- [ ] **Step 2.9: Commit**

```bash
git add supabase/functions/submit-demo-request/index.ts
git commit -m "feat: add submit-demo-request edge function"
```

---

## Chunk 2: Landing Page HTML

### Task 3: Create `landing/index.html` from approved mockup

**Files:**
- Create: `landing/index.html`

The approved mockup lives at:
`/Users/tony/jarvid/.superpowers/brainstorm/43360-1773700424/landing-mockup-v3.html`

This task takes that mockup and promotes it to production-ready HTML with:
- The real Supabase function URL wired up
- Form success/error states
- `.env.local` not required (the anon key is public-safe for this call)

- [ ] **Step 3.1: Create the landing directory**

```bash
mkdir -p /Users/tony/jarvid/landing
```

- [ ] **Step 3.2: Copy the approved mockup as the starting point**

```bash
cp /Users/tony/jarvid/.superpowers/brainstorm/43360-1773700424/landing-mockup-v3.html \
   /Users/tony/jarvid/landing/index.html
```

- [ ] **Step 3.3: Remove the mockup banner element and its CSS rule**

In `landing/index.html`, delete the banner element:

```html
<div class="mockup-banner">MOCKUP | Not final copy</div>
```

Also delete the corresponding CSS rule from the `<style>` block:

```css
  .mockup-banner {
    position: fixed; bottom: 16px; right: 16px;
    background: rgba(240,168,48,0.15); border: 1px solid rgba(240,168,48,0.3);
    border-radius: 8px; padding: 8px 16px;
    font-size: 12px; color: var(--accent); font-weight: 600; z-index: 999;
    pointer-events: none;
  }
```

- [ ] **Step 3.4: Replace the static form with a wired-up version**

**This step is mandatory.** The mockup's form inputs have no `name` attributes, which means `FormData` will not capture any values on submission. This replacement adds `name` attributes to all inputs and wires up the submit button id.

Replace the existing `<form id="demoForm" novalidate>` block (everything from `<form` to `</form>`) with the version below. The anon key placeholder (`PASTE_YOUR_ANON_KEY_HERE`) is substituted in Step 3.6 — leave it as-is here.

Find your anon key at: Supabase dashboard → Project Settings → API → `anon public` (you will need it in Step 3.6).

```html
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
      <label>No. of Sites <span class="req">*</span></label>
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
```

- [ ] **Step 3.5: Add the `<style>` for the success state**

Inside the existing `<style>` block, add at the end (before the closing `</style>`):

```css
.form-success {
  text-align: center;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.form-success svg { color: var(--accent); }
.form-success h3 {
  font-family: var(--font-display);
  font-size: 28px;
  letter-spacing: 0.04em;
}
.form-success p { font-size: 15px; color: var(--text-sub); }
```

- [ ] **Step 3.6: Replace the inline `<script>` block**

Remove the existing `<script>` block at the bottom of the file (the one with `updatePostcodeLabel`) and replace with the block below.

**Before writing:** substitute your real Supabase anon key for `PASTE_YOUR_ANON_KEY_HERE` (same key from Step 3.4, found at Supabase dashboard → Project Settings → API → anon public). Do not write the placeholder literal to disk.

Note: `document.getElementById("form")` targets `div.hero-form-wrap`, which retains `id="form"` from the original mockup. This id also serves as the anchor for the nav and footer CTAs — do not remove it.

```html
<script>
  const FUNCTION_URL =
    "https://kidyoplpqmvebujypndu.supabase.co/functions/v1/submit-demo-request";
  // Replace PASTE_YOUR_ANON_KEY_HERE with the real anon key before saving
  const ANON_KEY = "PASTE_YOUR_ANON_KEY_HERE";

  // ── Dynamic postcode label ──────────────────────────────────
  const numSitesInput = document.getElementById("numSites");
  const postcodeLabel = document.getElementById("postcodeLabel");
  const postcodeInput = document.getElementById("postcodeInput");

  function updatePostcodeLabel() {
    const val = parseInt(numSitesInput.value, 10);
    const isMulti = !isNaN(val) && val > 1;
    postcodeLabel.innerHTML =
      (isMulti ? "HQ Postcode" : "Postcode") + ' <span class="req">*</span>';
    postcodeInput.placeholder = isMulti ? "Head office postcode" : "M1 1AA";
  }
  numSitesInput.addEventListener("input", updatePostcodeLabel);

  // ── Form submission ─────────────────────────────────────────
  const form = document.getElementById("demoForm");
  const submitBtn = document.getElementById("submitBtn");
  const formError = document.getElementById("formError");
  const formWrap = document.getElementById("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // HTML5 validation
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "SENDING…";
    formError.style.display = "none";

    const data = Object.fromEntries(new FormData(form).entries());
    data.num_sites = parseInt(data.num_sites, 10);

    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Unexpected error");
      }

      // Replace form with success message
      formWrap.querySelector("form").replaceWith(
        Object.assign(document.createElement("div"), {
          className: "form-success",
          innerHTML: `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h3>YOU'RE ON THE LIST</h3>
            <p>Thanks — we'll be in touch within 24 hours.</p>
          `,
        })
      );
    } catch (err) {
      formError.textContent =
        "Something went wrong. Please try again or email sales@jarv-id.com.";
      formError.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = "REQUEST DEMO";
    }
  });
</script>
```

- [ ] **Step 3.7: Open the file in a browser and manually test the form**

```bash
open /Users/tony/jarvid/landing/index.html
```

Check:
- Page renders correctly (dark theme, split hero, all sections visible)
- "No. of Sites" > 1 changes label to "HQ Postcode"
- Clicking "REQUEST DEMO" with empty fields triggers browser validation
- With the real function URL and anon key in place, a valid submission shows the success state and a row appears in the Supabase dashboard

- [ ] **Step 3.8: Commit**

```bash
git add landing/index.html
git commit -m "feat: add landing page with form submission wired to Supabase"
```

---

## Chunk 3: Deployment

### Task 4: Deploy to Vercel and configure Jarv-ID.com

**Files:**
- Create: `landing/vercel.json`

This task deploys `landing/index.html` as a static site to Vercel and points `jarv-id.com` at it.

- [ ] **Step 4.1: Install Vercel CLI if not present**

```bash
npm i -g vercel
vercel --version
```

Expected: version number printed (e.g. `39.x.x`).

- [ ] **Step 4.2: Create `landing/vercel.json`**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 4.3: Deploy from the `landing/` directory**

```bash
cd /Users/tony/jarvid/landing
vercel --prod
```

Follow the prompts:
- Link to existing project or create new → create new, name it `jarv-id-landing`
- Root directory → `.` (current, i.e. `landing/`)
- No build command, output directory `.`

Expected: deployment URL printed (e.g. `https://jarv-id-landing-xxxxx.vercel.app`).

- [ ] **Step 4.4: Smoke-test the deployment URL**

Open the printed Vercel URL in a browser. Verify:
- Page loads with correct styling
- Form is present and functional

- [ ] **Step 4.5: Add the custom domain**

```bash
vercel domains add jarv-id.com
```

Vercel will print DNS records to add. At your domain registrar, add:
- `A` record: `@` → Vercel's IP (printed by CLI)
- `CNAME` record: `www` → `cname.vercel-dns.com`

Wait for DNS propagation (up to 48 hours). Vercel will automatically provision the SSL certificate.

- [ ] **Step 4.6: Verify production site**

Once DNS propagates, open `https://jarv-id.com` and:
- Confirm the page loads with HTTPS
- Submit a test form entry and confirm it appears in the `demo_requests` table and an email arrives at sales@jarv-id.com
- Delete the test row

- [ ] **Step 4.7: Commit**

```bash
cd /Users/tony/jarvid
git add landing/vercel.json
git commit -m "feat: add Vercel config for landing page deployment"
```

---

## Notes

- `.env.local` is gitignored — never commit it
- The Supabase anon key is safe to expose in the HTML (it's the public key, row-level security prevents abuse)
- The `RESEND_API_KEY` is a Supabase secret and never touches the client
- If Resend email delivery fails, the DB insert still succeeds — leads are never lost, only notifications may be delayed
- Adding the JARV-ID logo to the main app (`src/App.jsx`) is a separate task noted for a future session
