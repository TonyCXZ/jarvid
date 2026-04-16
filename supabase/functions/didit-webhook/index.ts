import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifySignature(req: Request, body: string): Promise<boolean> {
  const webhookSecret = Deno.env.get("DIDIT_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.warn("DIDIT_WEBHOOK_SECRET not set — skipping signature check");
    return true; // fail open until secret is configured; tighten before go-live
  }

  // X-Signature-Simple: HMAC-SHA256 of "timestamp:session_id:status:webhook_type"
  const timestamp = req.headers.get("X-Timestamp");
  const signature = req.headers.get("X-Signature-Simple");
  if (!timestamp || !signature) return false;

  // Reject stale webhooks (> 5 minutes)
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  let payload: Record<string, string>;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  const message = `${timestamp}:${payload.session_id}:${payload.status}:${payload.webhook_type}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const computed = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (computed.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const body = await req.text();

  const valid = await verifySignature(req, body);
  if (!valid) {
    console.error("Didit webhook signature invalid");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const payload = JSON.parse(body);
  const { session_id, status, vendor_data, webhook_type } = payload;

  // Only process final status updates
  if (webhook_type !== "status.updated") {
    return new Response("OK", { headers: CORS });
  }

  // Only record Approved/Declined — ignore Pending/In Review
  if (status !== "Approved" && status !== "Declined") {
    return new Response("OK", { headers: CORS });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const [, kiosk_id] = (vendor_data || "").split(":");
  const passed = status === "Approved";

  const { error } = await supabase.from("age_verifications").insert({
    kiosk_id: kiosk_id || null,
    method: "didit",
    result: passed ? "pass" : "fail",
    user_token_hash: `didit_${session_id.slice(0, 12)}`,
    verified_at: new Date().toISOString(),
  });

  if (error) console.error("age_verifications insert error:", error);

  return new Response("OK", { headers: CORS });
});
