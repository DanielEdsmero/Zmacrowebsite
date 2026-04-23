import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (
    !adminEmail ||
    user.email?.toLowerCase() !== adminEmail.toLowerCase()
  ) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_authorized");
  }

  return (
    <>
      <header className="border-b border-lime-term/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/admin"
            className="text-lg uppercase tracking-widest text-lime-term"
          >
            &gt; admin
          </Link>
          <div className="flex items-center gap-4 text-xs text-lime-dim">
            <span>{user.email}</span>
            <Link href="/" className="hover:text-lime-term">
              view site
            </Link>
            <form action="/admin/logout" method="POST">
              <button
                type="submit"
                className="uppercase tracking-widest hover:text-lime-term"
              >
                logout
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
