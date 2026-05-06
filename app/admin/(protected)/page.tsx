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
  const freeMacros = macros.filter((m) => !m.is_premium);
  const premiumMacros = macros.filter((m) => m.is_premium);

  // Purchase counts per macro
  const { data: purchaseCounts } = await supabase
    .from("purchases")
    .select("macro_id");
  const purchaseMap: Record<string, number> = {};
  for (const p of purchaseCounts ?? []) {
    purchaseMap[p.macro_id] = (purchaseMap[p.macro_id] ?? 0) + 1;
  }

  function MacroTable({ rows, showPurchases }: { rows: Macro[]; showPurchases?: boolean }) {
    return (
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
              {showPurchases && <th className="px-3 py-2">sales</th>}
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-b border-lime-term/10">
                <td className="px-3 py-2">{m.name}</td>
                <td className="px-3 py-2 text-lime-dim">{m.slug}</td>
                <td className="px-3 py-2">{m.version}</td>
                <td className="px-3 py-2">
                  {m.is_premium ? (
                    <span className="text-yellow-400">
                      ${Number(m.price_usd).toFixed(2)} PREMIUM
                    </span>
                  ) : Number(m.price_usd) > 0 ? (
                    `$${Number(m.price_usd).toFixed(2)}`
                  ) : (
                    "FREE"
                  )}
                </td>
                <td className="px-3 py-2">
                  {m.published ? (
                    <span className="text-lime-term">yes</span>
                  ) : (
                    <span className="text-lime-dim">draft</span>
                  )}
                </td>
                <td className="px-3 py-2">{m.download_count}</td>
                {showPurchases && (
                  <td className="px-3 py-2 text-yellow-400">
                    {purchaseMap[m.id] ?? 0}
                  </td>
                )}
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
    );
  }

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
        <>
          {/* Free macros */}
          {freeMacros.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-3 text-xs uppercase tracking-widest text-lime-dim">
                // free macros ({freeMacros.length})
              </h2>
              <MacroTable rows={freeMacros} />
            </section>
          )}

          {/* Premium macros */}
          <section>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-xs uppercase tracking-widest text-yellow-400">
                // premium macros ({premiumMacros.length})
              </h2>
              {premiumMacros.length > 0 && (
                <span className="text-xs text-lime-dim">
                  total sales: {Object.values(purchaseMap).reduce((a, b) => a + b, 0)}
                </span>
              )}
            </div>
            {premiumMacros.length === 0 ? (
              <p className="text-xs text-lime-dim border border-lime-term/20 p-4">
                &gt; no premium macros yet. create one and check &quot;premium&quot; in the form.
              </p>
            ) : (
              <MacroTable rows={premiumMacros} showPurchases />
            )}
          </section>
        </>
      )}
    </>
  );
}
