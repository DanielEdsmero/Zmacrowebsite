"use client";

import Link from "next/link";
import type { VouchWithMacro } from "@/lib/types";

function VouchThumb({ vouch }: { vouch: VouchWithMacro }) {
  return (
    <a
      href={vouch.image_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block h-28 w-44 shrink-0 overflow-hidden border border-lime-term/30 transition-colors hover:border-lime-term"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={vouch.image_url}
        alt=""
        className="h-full w-full object-cover opacity-75 transition-all duration-100 group-hover:animate-glitch group-hover:opacity-100"
      />
      {/* Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.18)_3px,rgba(0,0,0,0.18)_4px)]" />
      {/* Bottom label */}
      {vouch.macros && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
          <p className="truncate text-[9px] uppercase tracking-wider text-lime-dim">
            {vouch.macros.name}
          </p>
        </div>
      )}
    </a>
  );
}

export function VouchMarquee({ vouches }: { vouches: VouchWithMacro[] }) {
  if (vouches.length === 0) return null;

  // Need enough items to fill the screen width before the loop point.
  // Triplicate so there's always content even with a small dataset.
  const fill = [...vouches, ...vouches, ...vouches];

  return (
    <section className="border-y border-lime-term/20 py-5">
      <div className="mb-3 flex items-center justify-between px-4">
        <p className="text-[10px] uppercase tracking-widest text-lime-dim">
          // proof_of_work
        </p>
        <Link
          href="/vouches"
          className="text-[10px] uppercase tracking-widest text-lime-dim hover:text-lime-term"
        >
          view all →
        </Link>
      </div>

      {/* Row 1 — scrolls left */}
      <div className="group mb-2 overflow-hidden">
        <div className="flex w-max gap-2 animate-marquee group-hover:[animation-play-state:paused]">
          {fill.map((v, i) => (
            <VouchThumb key={`a-${v.id}-${i}`} vouch={v} />
          ))}
        </div>
      </div>

      {/* Row 2 — scrolls right (same items reversed) */}
      <div className="group overflow-hidden">
        <div className="flex w-max gap-2 animate-marquee-reverse group-hover:[animation-play-state:paused]">
          {[...fill].reverse().map((v, i) => (
            <VouchThumb key={`b-${v.id}-${i}`} vouch={v} />
          ))}
        </div>
      </div>
    </section>
  );
}
