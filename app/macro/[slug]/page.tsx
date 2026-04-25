import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { DownloadButton } from "@/components/DownloadButton";
import { ScanlineOverlay } from "@/components/ScanlineOverlay";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList } from "@/components/ReviewList";
import { createClient } from "@/lib/supabase/server";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import type { Macro, Review } from "@/lib/types";

export const revalidate = 30;

function formatPrice(price: number | string) {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return "FREE";
  return `$${n.toFixed(2)}`;
}

function avgRating(reviews: Review[]) {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return (sum / reviews.length).toFixed(1);
}

export default async function MacroDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const supabase = await createClient();

  const macroRes = await supabase
    .from("macros")
    .select("*")
    .eq("slug", params.slug)
    .eq("published", true)
    .maybeSingle();

  if (!macroRes.data) notFound();
  const macro = macroRes.data as Macro;

  const reviewsRes = await supabase
    .from("reviews")
    .select("*")
    .eq("macro_id", macro.id)
    .order("created_at", { ascending: false });

  const reviews = (reviewsRes.data ?? []) as Review[];

  const avg = avgRating(reviews);

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
              {avg && (
                <span className="text-lime-term">
                  ★ {avg}{" "}
                  <span className="text-lime-dim">({reviews.length})</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl uppercase tracking-widest md:text-4xl">
              {macro.name}
            </h1>

            <p className="text-sm text-lime-dim md:text-base">
              {macro.short_description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <DownloadButton
                macroId={macro.id}
                variant="hero"
                label={`DOWNLOAD ${macro.version}`}
              />
              {macro.github_url && (
                <a
                  href={macro.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-lime-term/50 px-4 py-2 text-xs uppercase tracking-wider text-lime-dim transition-colors hover:border-lime-term hover:text-lime-term"
                >
                  &gt; github
                </a>
              )}
            </div>
          </div>
        </div>
        <ScanlineOverlay />
      </section>

      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10">
        {macro.youtube_url && (() => {
          const embedUrl = getYouTubeEmbedUrl(macro.youtube_url);
          return embedUrl ? (
            <section>
              <h2 className="mb-3 text-xs uppercase tracking-widest text-lime-dim">
                // tutorial
              </h2>
              <div className="aspect-video w-full overflow-hidden border border-lime-term/40 bg-black">
                <iframe
                  src={embedUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={`${macro.name} tutorial`}
                />
              </div>
            </section>
          ) : null;
        })()}

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

        {/* Reviews */}
        <section>
          <h2 className="mb-4 text-xs uppercase tracking-widest text-lime-dim">
            // reviews{" "}
            {reviews.length > 0 && (
              <span className="text-lime-term/60">({reviews.length})</span>
            )}
          </h2>
          <ReviewList reviews={reviews} />
        </section>

        {/* Leave a review */}
        <section>
          <h2 className="mb-4 text-xs uppercase tracking-widest text-lime-dim">
            // leave a review
          </h2>
          <p className="mb-4 text-xs text-lime-dim">
            &gt; no account needed. tell others if it works, what it does, or
            flag it as a virus.
          </p>
          <ReviewForm macroId={macro.id} macroSlug={macro.slug} />
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-lime-dim">
        &gt; end of transmission
      </footer>
    </>
  );
}
