import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ScanlineOverlay } from "@/components/ScanlineOverlay";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Macro } from "@/lib/types";

export const dynamic = "force-dynamic";

function paymongoAuth() {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY not set");
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

async function fetchPaymongoSession(sessionId: string) {
  const res = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${sessionId}`, {
    headers: { Authorization: paymongoAuth() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function PurchaseSuccessPage(props: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await props.searchParams;
  if (!session_id) redirect("/");

  const sessionData = await fetchPaymongoSession(session_id);
  if (!sessionData) redirect("/");

  const attrs = sessionData?.data?.attributes;
  if (attrs?.status !== "completed") redirect("/");

  const macroId = attrs?.metadata?.macro_id as string | undefined;
  if (!macroId) redirect("/");

  const supabase = createAdminClient();

  // Upsert purchase (handles race between webhook and page load)
  const lineItems = attrs?.line_items as Array<{ amount: number }> | undefined;
  const amountPaid = lineItems?.reduce((sum: number, li: { amount: number }) => sum + li.amount, 0) ?? null;
  const buyerEmail = (attrs?.billing?.email ?? null) as string | null;

  await supabase.from("purchases").upsert(
    {
      macro_id: macroId,
      payment_session_id: session_id,
      buyer_email: buyerEmail,
      amount_paid: amountPaid,
    },
    { onConflict: "payment_session_id", ignoreDuplicates: true },
  );

  const { data: purchase } = await supabase
    .from("purchases")
    .select("download_token")
    .eq("payment_session_id", session_id)
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

          {buyerEmail && (
            <p className="text-xs text-lime-dim">
              receipt sent to: {buyerEmail}
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
