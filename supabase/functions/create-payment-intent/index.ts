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
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-10-28.acacia" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { venue_id, cart, order_id } = await req.json();
    console.log("create-payment-intent called", { venue_id, order_id, cartLength: cart?.length });

    if (!venue_id || !cart?.length) {
      return new Response(JSON.stringify({ error: "Missing venue_id or cart" }), { status: 400, headers: CORS });
    }

    const { data: venue, error: venueErr } = await supabase
      .from("venues")
      .select("stripe_account_id, jarvid_profit_share_pct")
      .eq("id", venue_id)
      .single();

    if (venueErr) console.error("venue fetch error", venueErr);
    console.log("venue", venue);

    if (!venue?.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: "Venue is not connected to Stripe. Ask an admin to complete Stripe onboarding." }),
        { status: 400, headers: CORS },
      );
    }

    const productIds = cart.map((i: { product_id: string }) => i.product_id);
    const { data: productRows } = await supabase.from("products").select("id, supply_price_pence").in("id", productIds);

    const supplyMap: Record<string, number> = {};
    (productRows || []).forEach((p: { id: string; supply_price_pence: number }) => {
      supplyMap[p.id] = p.supply_price_pence || 0;
    });

    const totalPence: number = cart.reduce(
      (s: number, i: { retail_pence: number; qty: number }) => s + i.retail_pence * i.qty, 0,
    );
    const grossProfit: number = cart.reduce(
      (s: number, i: { product_id: string; retail_pence: number; qty: number }) =>
        s + (i.retail_pence - (supplyMap[i.product_id] ?? 0)) * i.qty, 0,
    );

    const stripeFee = Math.ceil(totalPence * 0.015) + 20;
    const jarvidPct = venue.jarvid_profit_share_pct ?? 20;
    const venueFraction = (100 - jarvidPct) / 100;
    const transferAmount = Math.max(0, Math.round((grossProfit - stripeFee) * venueFraction));

    console.log("payment calc", { totalPence, grossProfit, stripeFee, transferAmount, destination: venue.stripe_account_id });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPence,
      currency: "gbp",
      transfer_data: { destination: venue.stripe_account_id, amount: transferAmount },
      metadata: { venue_id, ...(order_id ? { order_id } : {}) },
    });

    console.log("PaymentIntent created", paymentIntent.id);
    return new Response(JSON.stringify({ client_secret: paymentIntent.client_secret }), { headers: CORS });
  } catch (err) {
    console.error("create-payment-intent error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: CORS });
  }
});
