import Link from "next/link";
import type { Macro } from "@/lib/types";
import { DownloadButton } from "./DownloadButton";

function formatPrice(price: number | string) {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return "FREE";
  return `$${n.toFixed(2)}`;
}

export function MacroCard({ macro }: { macro: Macro }) {
  const price = formatPrice(macro.price_usd);

  return (
    <article className="flex flex-col border border-lime-term/40 bg-black/60 transition-colors hover:border-lime-term">
      <Link href={`/macro/${macro.slug}`} className="block">
        <div className="aspect-video w-full overflow-hidden border-b border-lime-term/40 bg-black">
          {macro.cover_url ? (
            // Using <img> rather than next/image to avoid config churn for
            // arbitrary Supabase project hostnames at build time.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={macro.cover_url}
              alt=""
              className="h-full w-full object-cover opacity-90"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-lime-dim">
              [no cover]
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/macro/${macro.slug}`}
            className="text-sm uppercase tracking-wider hover:underline"
          >
            {macro.name}
          </Link>
          <span className="shrink-0 border border-lime-term/40 px-2 py-0.5 text-[10px] text-lime-dim">
            {macro.version}
          </span>
        </div>

        <p className="flex-1 text-xs leading-relaxed text-lime-dim">
          {macro.short_description}
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm">{price}</span>
          <DownloadButton macroId={macro.id} />
        </div>
      </div>
    </article>
  );
}
