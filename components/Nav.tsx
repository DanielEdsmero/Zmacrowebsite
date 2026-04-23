import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b border-lime-term/30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg tracking-widest">
          <span className="text-lime-dim">&gt;</span>{" "}
          <span className="text-lime-term">Z_MACRO</span>
          <span className="ml-1 animate-pulse text-lime-term">_</span>
        </Link>
        <nav className="text-xs uppercase tracking-widest text-lime-dim">
          <Link href="/" className="hover:text-lime-term">
            macros
          </Link>
        </nav>
      </div>
    </header>
  );
}
