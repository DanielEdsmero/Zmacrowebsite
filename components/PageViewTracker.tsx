"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageViewTracker({ macroId }: { macroId?: string }) {
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, macroId: macroId ?? null }),
    }).catch(() => {});
  }, [pathname, macroId]);

  return null;
}
