import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Macro } from "@/lib/types";
import { deleteMacroAction } from "./macro/actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("macros")
    .select("*")
    .order("created_at", { ascending: false });

  const macros = (data ?? []) as Macro[];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg uppercase tracking-widest">// macros</h1>
        <Link
          href="/admin/macro/new"
          className="border border-lime-term px-4 py-2 text-xs uppercase tracking-widest hover:bg-lime-term hover:text-black"
        >
          &gt; add new macro
        </Link>
      </div>

      {error ? (
        <p className="text-sm text-red-400">[err] {error.message}</p>
      ) : macros.length === 0 ? (
        <p className="text-sm text-lime-dim">
          &gt; no macros yet. create the first one.
        </p>
      ) : (
        <div className="overflow-x-auto border border-lime-term/30">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-lime-term/30 text-lime-dim">
              <tr>
                <th className="px-3 py-2">name</th>
                <th className="px-3 py-2">slug</th>
                <th className="px-3 py-2">version</th>
                <th className="px-3 py-2">price</th>
                <th className="px-3 py-2">published</th>
                <th className="px-3 py-2">dl</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {macros.map((m) => (
                <tr key={m.id} className="border-b border-lime-term/10">
                  <td className="px-3 py-2">{m.name}</td>
                  <td className="px-3 py-2 text-lime-dim">{m.slug}</td>
                  <td className="px-3 py-2">{m.version}</td>
                  <td className="px-3 py-2">
                    {Number(m.price_usd) > 0
                      ? `$${Number(m.price_usd).toFixed(2)}`
                      : "FREE"}
                  </td>
                  <td className="px-3 py-2">
                    {m.published ? (
                      <span className="text-lime-term">yes</span>
                    ) : (
                      <span className="text-lime-dim">draft</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{m.download_count}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/macro/${m.id}/edit`}
                        className="hover:text-lime-term"
                      >
                        edit
                      </Link>
                      <form action={deleteMacroAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <button
                          type="submit"
                          className="text-red-400 hover:text-red-300"
                        >
                          delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
