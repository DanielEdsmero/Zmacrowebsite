import Link from "next/link";
import { Nav } from "@/components/Nav";
import { MacroCard } from "@/components/MacroCard";
import { ScanlineOverlay } from "@/components/ScanlineOverlay";
import { PageViewTracker } from "@/components/PageViewTracker";
import { createClient } from "@/lib/supabase/server";
import type { Macro, ReviewWithMacro } from "@/lib/types";

export const revalidate = 30;

const safetyConfig = {
  safe: { label: "✓ SAFE", cls: "text-lime-term border-lime-term/50" },
  virus: { label: "⚠ VIRUS", cls: "text-red-400 border-red-400/50" },
  unsure: { label: "? UNSURE", cls: "text-yellow-400 border-yellow-400/50" },
};

export default async function HomePage() {
  const supabase = await createClient();

  const [macroRes, ratingsRes, recentRes] = await Promise.all([
    supabase
      .from("macros")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    // Ratings for avg display on cards
    supabase.from("reviews").select("macro_id, rating"),
    // Most recent reviews with macro info for the global feed
    supabase
      .from("reviews")
      .select("*, macros(name, slug)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const macros = (macroRes.data ?? []) as Macro[];

  // Build a rating map: macroId -> { avg, count }
  type RatingEntry = { avg: number; count: number };
  const ratingMap: Record<string, RatingEntry> = {};
  for (const r of (ratingsRes.data ?? []) as { macro_id: string; rating: number }[]) {
    const e = ratingMap[r.macro_id];
    if (e) {
      e.avg = (e.avg * e.count + r.rating) / (e.count + 1);
      e.count += 1;
    } else {
      ratingMap[r.macro_id] = { avg: r.rating, count: 1 };
    }
  }

  const recentReviews = (recentRes.data ?? []) as ReviewWithMacro[];

  return (
    <>
      <PageViewTracker />
      <Nav />

      <section className="relative overflow-hidden border-b border-lime-term/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-3xl uppercase tracking-[0.3em] md:text-5xl">
            Z_MACRO
          </h1>
          <p className="mt-4 max-w-xl text-sm text-lime-dim md:text-base">
            &gt; macro binaries // version-tagged // free &amp; paid drops
          </p>
        </div>
        <ScanlineOverlay />
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {macroRes.error ? (
          <p className="text-sm text-red-400">
            [error] failed to load macros: {macroRes.error.message}
          </p>
        ) : macros.length === 0 ? (
          <p className="text-sm text-lime-dim">
            &gt; no macros published yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {macros.map((m) => (
              <MacroCard
                key={m.id}
                macro={m}
                avgRating={ratingMap[m.id]?.avg}
                reviewCount={ratingMap[m.id]?.count}
              />
            ))}
          </div>
        )}

        {/* Recent reviews feed */}
        {recentReviews.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-xs uppercase tracking-widest text-lime-dim">
              // recent reviews
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentReviews.map((r) => {
                const safety = r.safety_vote
                  ? safetyConfig[r.safety_vote]
                  : null;
                const macroName = r.macros?.name;
                const macroSlug = r.macros?.slug;
                return (
                  <article
                    key={r.id}
                    className="border border-lime-term/20 bg-black/40 p-4"
                  >
                    {macroName && macroSlug && (
                      <Link
                        href={`/macro/${macroSlug}`}
                        className="mb-2 block text-[10px] uppercase tracking-wider text-lime-dim hover:text-lime-term"
                      >
                        {macroName}
                      </Link>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm tracking-tight text-lime-term">
                        {"★".repeat(r.rating)}
                        <span className="text-lime-term/25">
                          {"★".repeat(5 - r.rating)}
                        </span>
                      </span>
                      {safety && (
                        <span
                          className={`border px-1 py-0.5 font-mono text-[9px] ${safety.cls}`}
                        >
                          {safety.label}
                        </span>
                      )}
                      <span className="ml-auto text-[10px] text-lime-dim">
                        {r.author_name}
                      </span>
                    </div>
                    {r.body && (
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-lime-dim">
                        {r.body}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-lime-dim">
        &gt; end of transmission
      </footer>
    </>
  );
}
