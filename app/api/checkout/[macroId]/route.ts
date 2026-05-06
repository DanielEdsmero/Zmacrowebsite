import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ macroId: string }> },
) {
  const { macroId } = await params;

  const supabase = createAdminClient();
  const { data: macro, error } = await supabase
    .from("macros")
    .select("id, name, slug, price_usd, is_premium, stripe_price_id, published, cover_url")
    .eq("id", macroId)
    .eq("published", true)
    .maybeSingle();

  if (error || !macro) {
    return NextResponse.json({ error: "macro not found" }, { status: 404 });
  }

  if (!macro.is_premium) {
    return NextResponse.json({ error: "macro is not premium" }, { status: 400 });
  }

  const priceUsd = Number(macro.price_usd);
  if (priceUsd <= 0 && !macro.stripe_price_id) {
    return NextResponse.json({ error: "macro has no price configured" }, { status: 400 });
  }

  const stripe = getStripe();
  const origin = request.headers.get("origin") ?? request.nextUrl.origin;

  const lineItem = macro.stripe_price_id
    ? { price: macro.stripe_price_id, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(priceUsd * 100),
          product_data: {
            name: macro.name,
            images: macro.cover_url ? [macro.cover_url] : [],
          },
        },
      };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [lineItem],
    success_url: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/macro/${macro.slug}`,
    metadata: {
      macro_id: macro.id,
      macro_slug: macro.slug,
    },
  });

  return NextResponse.json({ url: session.url });
}
