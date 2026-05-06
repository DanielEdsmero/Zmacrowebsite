import { redirect } from "next/navigation";
import Link from "next/link";
import Stripe from "stripe";
import { Nav } from "@/components/Nav";
import { ScanlineOverlay } from "@/components/ScanlineOverlay";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Macro } from "@/lib/types";

export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key);
}

export default async function PurchaseSuccessPage(props: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await props.searchParams;
  if (!session_id) redirect("/");

  const stripe = getStripe();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    redirect("/");
  }

  if (session.payment_status !== "paid") redirect("/");

  const macroId = session.metadata?.macro_id;
  if (!macroId) redirect("/");

  const supabase = createAdminClient();

  // Upsert purchase (handles race between webhook and page load)
  await supabase.from("purchases").upsert(
    {
      macro_id: macroId,
      stripe_session_id: session.id,
      buyer_email: session.customer_details?.email ?? null,
      amount_paid: session.amount_total,
    },
    { onConflict: "stripe_session_id", ignoreDuplicates: true },
  );

  // Fetch the purchase record to get the download_token
  const { data: purchase } = await supabase
    .from("purchases")
    .select("download_token")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  const { data: macro } = await supabase
    .from("macros")
    .select("id, name, slug, version")
    .eq("id", macroId)
    .maybeSingle();

  const macroData = macro as Pick<Macro, "id" | "name" | "slug" | "version"> | null;
  const downloadUrl = purchase
    ? `/api/download/${macroId}?token=${purchase.download_token}`
    : null;

  return (
    <>
      <Nav />
      <section className="relative overflow-hidden border-b border-lime-term/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs uppercase tracking-widest text-lime-dim mb-2">// payment confirmed</p>
          <h1 className="text-3xl uppercase tracking-[0.2em] md:text-4xl text-lime-term">
            purchase complete
          </h1>
        </div>
        <ScanlineOverlay />
      </section>

      <main className="mx-auto max-w-2xl px-4 py-14 flex flex-col gap-8">
        <div className="border border-lime-term/30 bg-black/40 p-6 flex flex-col gap-4">
          <p className="text-xs uppercase tracking-widest text-lime-dim">
            &gt; transaction verified
          </p>

          {macroData && (
            <p className="text-sm">
              <span className="text-lime-dim">macro: </span>
              <span className="text-lime-term">{macroData.name}</span>
              <span className="text-lime-dim"> {macroData.version}</span>
            </p>
          )}

          {session.customer_details?.email && (
            <p className="text-xs text-lime-dim">
              receipt sent to: {session.customer_details.email}
            </p>
          )}
        </div>

        {downloadUrl ? (
          <div className="border border-lime-term/50 bg-black/40 p-6 flex flex-col gap-4">
            <p className="text-xs uppercase tracking-widest text-lime-dim">
              // your download link
            </p>
            <p className="text-xs text-lime-dim leading-relaxed">
              &gt; save this page or bookmark the link below — it is your permanent download access.
            </p>
            <a
              href={downloadUrl}
              className="inline-block border border-lime-term bg-black px-8 py-4 text-base uppercase tracking-widest text-lime-term transition-colors hover:bg-lime-term hover:text-black"
            >
              &gt; download now
            </a>
            <p className="text-[10px] text-lime-dim/60 break-all">
              permanent link: {downloadUrl}
            </p>
          </div>
        ) : (
          <p className="text-xs text-red-400">
            [err] could not generate download link. contact support with session id: {session_id}
          </p>
        )}

        {macroData && (
          <Link
            href={`/macro/${macroData.slug}`}
            className="text-xs uppercase tracking-widest text-lime-dim hover:text-lime-term"
          >
            &lt; back to {macroData.name}
          </Link>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-lime-dim">
        &gt; end of transmission
      </footer>
    </>
  );
}
