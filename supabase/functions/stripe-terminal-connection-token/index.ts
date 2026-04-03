import Stripe from "https://esm.sh/stripe@14.21.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-10-28.acacia",
    });

    const connectionToken = await stripe.terminal.connectionTokens.create();

    return new Response(
      JSON.stringify({ secret: connectionToken.secret }),
      { headers: CORS },
    );
  } catch (err) {
    console.error("stripe-terminal-connection-token error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: CORS },
    );
  }
});
