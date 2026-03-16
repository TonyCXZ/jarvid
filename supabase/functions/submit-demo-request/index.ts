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
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
