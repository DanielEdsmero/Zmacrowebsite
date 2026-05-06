import type { Review } from "@/lib/types";

const safetyConfig = {
  safe: { label: "✓ SAFE", cls: "text-lime-term border-lime-term/50" },
  virus: { label: "⚠ VIRUS", cls: "text-red-400 border-red-400/50" },
  unsure: { label: "? UNSURE", cls: "text-yellow-400 border-yellow-400/50" },
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm tracking-tight text-lime-term">
      {"★".repeat(rating)}
      <span className="text-lime-term/25">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-xs text-lime-dim">
        &gt; no reviews yet. be the first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((r) => {
        const safety = r.safety_vote ? safetyConfig[r.safety_vote] : null;
        return (
          <article
            key={r.id}
            className="border border-lime-term/20 bg-black/40 p-4"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars rating={r.rating} />
              {safety && (
                <span
                  className={`border px-1.5 py-0.5 font-mono text-[10px] ${safety.cls}`}
                >
                  {safety.label}
                </span>
              )}
              <span className="ml-auto text-[10px] text-lime-dim">
                {r.author_name} ·{" "}
                {new Date(r.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            {r.body && (
              <p className="mt-2 text-xs leading-relaxed text-lime-dim">
                {r.body}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
