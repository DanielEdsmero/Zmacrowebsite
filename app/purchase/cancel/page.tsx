import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ScanlineOverlay } from "@/components/ScanlineOverlay";

export default function PurchaseCancelPage() {
  return (
    <>
      <Nav />
      <section className="relative overflow-hidden border-b border-lime-term/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs uppercase tracking-widest text-lime-dim mb-2">// checkout cancelled</p>
          <h1 className="text-3xl uppercase tracking-[0.2em] md:text-4xl">
            payment cancelled
          </h1>
        </div>
        <ScanlineOverlay />
      </section>

      <main className="mx-auto max-w-2xl px-4 py-14 flex flex-col gap-6">
        <p className="text-sm text-lime-dim">
          &gt; no charge was made. you can go back and try again whenever you&apos;re ready.
        </p>
        <Link
          href="/"
          className="inline-block border border-lime-term/50 px-6 py-2 text-xs uppercase tracking-widest text-lime-dim hover:border-lime-term hover:text-lime-term"
        >
          &lt; back to macros
        </Link>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-lime-dim">
        &gt; end of transmission
      </footer>
    </>
  );
}
