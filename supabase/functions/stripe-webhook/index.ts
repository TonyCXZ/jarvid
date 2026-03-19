import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-10-28.acacia",
});

Deno.serve(async (req: Request) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  console.log("sig prefix:", sig?.slice(0, 20));
  console.log("webhook secret prefix:", webhookSecret?.slice(0, 10));
  console.log("body length:", body.length);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret!);
  } catch (err) {
    console.error("Webhook signature verification failed:", (err as Error).message);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;

    // Link the payment intent to the order and mark as completed (backup/reconciliation)
    if (pi.metadata?.order_id) {
      await supabase
        .from("orders")
        .update({ status: "completed", stripe_payment_intent_id: pi.id })
        .eq("id", pi.metadata.order_id)
        .eq("status", "pending");
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    if (pi.metadata?.order_id) {
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", pi.metadata.order_id)
        .eq("status", "pending");
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
