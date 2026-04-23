"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ initialError }: { initialError: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr) {
      setError(signInErr.message);
      setPending(false);
      return;
    }

    // The server-side layout at /admin is the real gate. If this user isn't
    // the admin, it will sign them out and bounce them back here with an
    // `?error=not_authorized` query flag.
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-lime-dim">
        email
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-lime-term/40 bg-black px-3 py-2 text-sm text-lime-term outline-none focus:border-lime-term"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-lime-dim">
        password
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-lime-term/40 bg-black px-3 py-2 text-sm text-lime-term outline-none focus:border-lime-term"
        />
      </label>
      {error ? <p className="text-xs text-red-400">[err] {error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="border border-lime-term bg-black px-4 py-2 text-xs uppercase tracking-widest text-lime-term hover:bg-lime-term hover:text-black disabled:opacity-50"
      >
        {pending ? "authenticating..." : "> login"}
      </button>
    </form>
  );
}
