import { Nav } from "@/components/Nav";
import { MacroCard } from "@/components/MacroCard";
import { ScanlineOverlay } from "@/components/ScanlineOverlay";
import { createClient } from "@/lib/supabase/server";
import type { Macro } from "@/lib/types";

export const revalidate = 30;

export default async function HomePage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("macros")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const macros = (data ?? []) as Macro[];

  return (
    <>
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
        {error ? (
          <p className="text-sm text-red-400">
            [error] failed to load macros: {error.message}
          </p>
        ) : macros.length === 0 ? (
          <p className="text-sm text-lime-dim">
            &gt; no macros published yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {macros.map((m) => (
              <MacroCard key={m.id} macro={m} />
            ))}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-lime-dim">
        &gt; end of transmission
      </footer>
    </>
  );
}
