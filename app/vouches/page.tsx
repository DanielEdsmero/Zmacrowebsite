import { Nav } from "@/components/Nav";
import { ScanlineOverlay } from "@/components/ScanlineOverlay";
import { PageViewTracker } from "@/components/PageViewTracker";
import { VouchForm } from "@/components/VouchForm";
import { createClient } from "@/lib/supabase/server";
import type { Macro, VouchWithMacro } from "@/lib/types";
import Link from "next/link";

export const revalidate = 30;

export default async function VouchesPage() {
  const supabase = await createClient();

  const [vouchRes, macroRes] = await Promise.all([
    supabase
      .from("vouches")
      .select("*, macros(name, slug)")
      .order("created_at", { ascending: false }),
    supabase
      .from("macros")
      .select("id, name")
      .eq("published", true)
      .order("name", { ascending: true }),
  ]);

  const vouches = (vouchRes.data ?? []) as VouchWithMacro[];
  const macros = (macroRes.data ?? []) as Pick<Macro, "id" | "name">[];

  return (
    <>
      <PageViewTracker />
      <Nav />

      <section className="relative overflow-hidden border-b border-lime-term/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-3xl uppercase tracking-[0.3em] md:text-5xl">
            VOUCHES
          </h1>
          <p className="mt-4 max-w-xl text-sm text-lime-dim md:text-base">
            &gt; community proof // screenshots don&apos;t lie // submit yours
          </p>
        </div>
        <ScanlineOverlay />
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {vouches.length === 0 ? (
          <p className="mb-10 text-sm text-lime-dim">
            &gt; no vouches yet. be the first to submit proof.
          </p>
        ) : (
          <div className="mb-14 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {vouches.map((v) => (
              <article
                key={v.id}
                className="group mb-4 break-inside-avoid border border-lime-term/30 bg-black/60 transition-colors hover:border-lime-term"
              >
                {/* Image */}
                <a
                  href={v.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.image_url}
                    alt=""
                    className="w-full object-cover opacity-85 transition-all duration-100 group-hover:animate-glitch group-hover:opacity-100"
                  />
                  {/* Scanline */}
                  <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.15)_3px,rgba(0,0,0,0.15)_4px)]" />
                  <div className="absolute bottom-2 right-2 border border-lime-term/50 bg-black/80 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-lime-dim opacity-0 transition-opacity group-hover:opacity-100">
                    view full
                  </div>
                </a>

                {/* Meta */}
                <div className="p-3">
                  {v.macros && (
                    <Link
                      href={`/macro/${v.macros.slug}`}
                      className="mb-1 block text-[10px] uppercase tracking-wider text-lime-dim hover:text-lime-term"
                    >
                      {v.macros.name}
                    </Link>
                  )}
                  {v.caption && (
                    <p className="mb-1 text-xs leading-relaxed text-lime-term">
                      &ldquo;{v.caption}&rdquo;
                    </p>
                  )}
                  <p className="text-[10px] text-lime-dim">
                    {v.author_name} ·{" "}
                    {new Date(v.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Submit section */}
        <section className="border-t border-lime-term/20 pt-10">
          <h2 className="mb-2 text-xs uppercase tracking-widest text-lime-dim">
            // submit a vouch
          </h2>
          <p className="mb-6 text-xs text-lime-dim">
            &gt; no account needed. drop a screenshot — virustotal scan, it
            running, anything that proves the real.
          </p>
          <VouchForm macros={macros} />
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-lime-dim">
        &gt; end of transmission
      </footer>
    </>
  );
}
