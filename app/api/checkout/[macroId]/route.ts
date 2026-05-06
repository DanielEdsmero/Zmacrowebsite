import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function paymongoAuth() {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY not set");
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ macroId: string }> },
) {
  const { macroId } = await params;

  const supabase = createAdminClient();
  const { data: macro, error } = await supabase
    .from("macros")
    .select("id, name, slug, price_usd, price_php, is_premium, published, cover_url")
    .eq("id", macroId)
    .eq("published", true)
    .maybeSingle();

  if (error || !macro) {
    return NextResponse.json({ error: "macro not found" }, { status: 404 });
  }

  if (!macro.is_premium) {
    return NextResponse.json({ error: "macro is not premium" }, { status: 400 });
  }

  // price_php in centavos; fall back to price_usd × 56 PHP/USD
  const pricePHP: number =
    macro.price_php ??
    Math.round(Number(macro.price_usd) * 56 * 100);

  if (pricePHP <= 0) {
    return NextResponse.json({ error: "macro has no price configured" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? request.nextUrl.origin;

  const res = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: paymongoAuth(),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [
            {
              currency: "PHP",
              amount: pricePHP,
              name: macro.name,
              quantity: 1,
            },
          ],
          payment_method_types: ["card", "gcash", "paymaya", "grab_pay"],
          success_url: `${origin}/purchase/success?session_id={id}`,
          cancel_url: `${origin}/macro/${macro.slug}`,
          metadata: {
            macro_id: macro.id,
            macro_slug: macro.slug,
          },
          send_email_receipt: true,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error("[checkout] PayMongo error", body);
    return NextResponse.json({ error: "payment provider error" }, { status: 502 });
  }

  const data = await res.json();
  const url = data?.data?.attributes?.checkout_url;

  return NextResponse.json({ url });
}
