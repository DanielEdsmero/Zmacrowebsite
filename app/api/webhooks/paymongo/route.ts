import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, header: string, secret: string): boolean {
  // Header format: t=<timestamp>,te=<test_hmac>,li=<live_hmac>
  const parts: Record<string, string> = {};
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq !== -1) parts[part.slice(0, eq)] = part.slice(eq + 1);
  }

  const timestamp = parts["t"];
  if (!timestamp) return false;

  const message = `${timestamp}.${rawBody}`;
  const computed = crypto.createHmac("sha256", secret).update(message).digest("hex");

  // Accept either test (te) or live (li) signature
  return computed === parts["te"] || computed === parts["li"];
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("paymongo-signature");

  if (!sig || !verifySignature(rawBody, sig, webhookSecret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventType = (payload?.data as Record<string, unknown>)?.attributes
    ? ((payload.data as Record<string, unknown>).attributes as Record<string, unknown>)?.type
    : null;

  if (eventType === "checkout_session.payment.paid") {
    const sessionAttrs = (
      ((payload.data as Record<string, unknown>).attributes as Record<string, unknown>)
        .data as Record<string, unknown>
    )?.attributes as Record<string, unknown> | undefined;

    const macroId = (sessionAttrs?.metadata as Record<string, string> | undefined)?.macro_id;
    const sessionId = (
      ((payload.data as Record<string, unknown>).attributes as Record<string, unknown>)
        .data as Record<string, unknown>
    )?.id as string | undefined;

    if (macroId && sessionId) {
      const lineItems = sessionAttrs?.line_items as Array<{ amount: number }> | undefined;
      const amountPaid = lineItems?.reduce((sum, li) => sum + li.amount, 0) ?? null;
      const buyerEmail =
        (sessionAttrs?.billing as Record<string, string> | undefined)?.email ?? null;

      const supabase = createAdminClient();
      await supabase.from("purchases").upsert(
        {
          macro_id: macroId,
          payment_session_id: sessionId,
          buyer_email: buyerEmail,
          amount_paid: amountPaid,
        },
        { onConflict: "payment_session_id", ignoreDuplicates: true },
      );
    }
  }

  return NextResponse.json({ received: true });
}
