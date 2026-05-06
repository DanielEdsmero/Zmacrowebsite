"use client";

import { useState } from "react";

type Variant = "card" | "hero";

export function BuyButton({
  macroId,
  price,
  variant = "card",
}: {
  macroId: string;
  price: number;
  variant?: Variant;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base =
    "inline-block border border-yellow-400 bg-black uppercase tracking-widest text-yellow-400 transition-colors hover:bg-yellow-400 hover:text-black disabled:opacity-50";
  const size = variant === "hero" ? "px-8 py-4 text-base" : "px-4 py-2 text-xs";

  async function handleBuy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/checkout/${macroId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "checkout failed");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleBuy}
        disabled={loading}
        className={`${base} ${size}`}
      >
        {loading ? "redirecting..." : `> buy $${Number(price).toFixed(2)}`}
      </button>
      {error && <p className="text-[10px] text-red-400">[err] {error}</p>}
    </div>
  );
}
