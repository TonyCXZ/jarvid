import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("STRIPE_SECRET_KEY present:", !!stripeKey);
    const stripe = new Stripe(stripeKey!, { apiVersion: "2024-10-28.acacia" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { venue_id, return_url } = await req.json();
    console.log("stripe-connect-onboard called", { venue_id, return_url });

    if (!venue_id || !return_url) {
      return new Response(JSON.stringify({ error: "Missing venue_id or return_url" }), {
        status: 400, headers: CORS,
      });
    }

    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("stripe_account_id, name")
      .eq("id", venue_id)
      .single();

    if (venueError) console.error("venues query error", venueError);
    console.log("venue fetched", venue);

    let accountId: string = venue?.stripe_account_id;

    if (!accountId) {
      console.log("creating Stripe account for venue", venue_id);
      const account = await stripe.accounts.create({
        type: "express",
        country: "GB",
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        metadata: { venue_id, venue_name: venue?.name ?? "" },
      });
      accountId = account.id;
      console.log("Stripe account created", accountId);

      await supabase
        .from("venues")
        .update({ stripe_account_id: accountId })
        .eq("id", venue_id);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: return_url,
      return_url: return_url,
      type: "account_onboarding",
    });

    return new Response(JSON.stringify({ url: accountLink.url }), { headers: CORS });
  } catch (err) {
    console.error("stripe-connect-onboard error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: CORS,
    });
  }
});
