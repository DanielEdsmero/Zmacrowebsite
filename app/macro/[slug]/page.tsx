import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { DownloadButton } from "@/components/DownloadButton";
import { ScanlineOverlay } from "@/components/ScanlineOverlay";
import { PageViewTracker } from "@/components/PageViewTracker";
import { createClient } from "@/lib/supabase/server";
import type { Macro } from "@/lib/types";

export const revalidate = 30;

function formatPrice(price: number | string) {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return "FREE";
  return `$${n.toFixed(2)}`;
}

export default async function MacroDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("macros")
    .select("*")
    .eq("slug", params.slug)
    .eq("published", true)
    .maybeSingle();

  if (!data) notFound();
  const macro = data as Macro;

  return (
    <>
      <PageViewTracker macroId={macro.id} />
      <Nav />

      <section className="relative overflow-hidden border-b border-lime-term/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2">
          <div className="aspect-video w-full overflow-hidden border border-lime-term/40 bg-black">
            {macro.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={macro.cover_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-lime-dim">
                [no cover]
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-xs text-lime-dim">
              <span className="border border-lime-term/40 px-2 py-0.5">
                {macro.version}
              </span>
              <span>{formatPrice(macro.price_usd)}</span>
              <span>dl: {macro.download_count}</span>
            </div>

            <h1 className="text-2xl uppercase tracking-widest md:text-4xl">
              {macro.name}
            </h1>

            <p className="text-sm text-lime-dim md:text-base">
              {macro.short_description}
            </p>

            <div className="pt-4">
              <DownloadButton
                macroId={macro.id}
                variant="hero"
                label={`DOWNLOAD ${macro.version}`}
              />
            </div>
          </div>
        </div>
        <ScanlineOverlay />
      </section>

      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10">
        {macro.long_description ? (
          <section>
            <h2 className="mb-3 text-xs uppercase tracking-widest text-lime-dim">
              // readme
            </h2>
            <pre className="whitespace-pre-wrap break-words border border-lime-term/30 bg-black/40 p-4 text-sm leading-relaxed">
              {macro.long_description}
            </pre>
          </section>
        ) : null}

        {macro.screenshots && macro.screenshots.length > 0 ? (
          <section>
            <h2 className="mb-3 text-xs uppercase tracking-widest text-lime-dim">
              // screenshots
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {macro.screenshots.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${url}-${i}`}
                  src={url}
                  alt=""
                  className="w-full border border-lime-term/30 object-cover"
                />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-3 text-xs uppercase tracking-widest text-lime-dim">
            // version
          </h2>
          <p className="text-sm">
            current: <span className="text-lime-term">{macro.version}</span>
          </p>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-lime-dim">
        &gt; end of transmission
      </footer>
    </>
  );
}
