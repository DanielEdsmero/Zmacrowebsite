type Variant = "card" | "hero";

export function DownloadButton({
  macroId,
  variant = "card",
  label = "DOWNLOAD",
}: {
  macroId: string;
  variant?: Variant;
  label?: string;
}) {
  const base =
    "inline-block border border-lime-term bg-black uppercase tracking-widest text-lime-term transition-colors hover:bg-lime-term hover:text-black";
  const size =
    variant === "hero"
      ? "px-8 py-4 text-base"
      : "px-4 py-2 text-xs";

  return (
    <form action={`/api/download/${macroId}`} method="POST">
      <button type="submit" className={`${base} ${size}`}>
        &gt; {label}
      </button>
    </form>
  );
}
