import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function groupByDay(
  timestamps: (string | null)[],
  days = 14,
): { day: string; count: number }[] {
  const result: Record<string, number> = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result[d.toISOString().split("T")[0]] = 0;
  }
  for (const ts of timestamps) {
    if (!ts) continue;
    const day = ts.split("T")[0];
    if (day in result) result[day]++;
  }
  return Object.entries(result).map(([day, count]) => ({ day, count }));
}

function BarChart({
  data,
  label,
}: {
  data: { day: string; count: number }[];
  label: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="border border-lime-term/30 p-4">
      <h2 className="mb-4 text-xs uppercase tracking-widest text-lime-dim">
        {label}
      </h2>
      <div className="flex h-20 items-end gap-px">
        {data.map(({ day, count }) => (
          <div key={day} className="relative flex h-full flex-1 items-end">
            <div
              className="w-full bg-lime-term/60 hover:bg-lime-term"
              style={{
                height: count > 0 ? `${Math.max((count / max) * 100, 4)}%` : "0%",
              }}
              title={`${day}: ${count}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-lime-dim">
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

export default async function StatsPage() {
  const supabase = createAdminClient();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalViews },
    { count: viewsToday },
    { count: viewsWeek },
    { data: macroRows },
    { count: dlsToday },
    { data: viewTimestamps },
    { data: dlTimestamps },
    { data: topMacros },
    { data: pagesRaw },
    { data: recentDls },
  ] = await Promise.all([
    supabase.from("page_views").select("*", { count: "exact", head: true }),
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("viewed_at", todayStr),
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("viewed_at", weekAgo),
    supabase.from("macros").select("published, download_count"),
    supabase
      .from("download_logs")
      .select("*", { count: "exact", head: true })
      .gte("downloaded_at", todayStr),
    supabase
      .from("page_views")
      .select("viewed_at")
      .gte("viewed_at", twoWeeksAgo),
    supabase
      .from("download_logs")
      .select("downloaded_at")
      .gte("downloaded_at", twoWeeksAgo),
    supabase
      .from("macros")
      .select("name, slug, download_count")
      .order("download_count", { ascending: false })
      .limit(5),
    supabase
      .from("page_views")
      .select("path")
      .gte("viewed_at", weekAgo),
    supabase
      .from("download_logs")
      .select("downloaded_at, ip, macros(name)")
      .order("downloaded_at", { ascending: false })
      .limit(10),
  ]);

  const macros = macroRows ?? [];
  const publishedCount = macros.filter((m) => m.published).length;
  const draftCount = macros.filter((m) => !m.published).length;
  const totalDownloads = macros.reduce(
    (s, m) => s + (m.download_count ?? 0),
    0,
  );

  const viewsByDay = groupByDay(
    (viewTimestamps ?? []).map((r) => r.viewed_at),
  );
  const dlsByDay = groupByDay(
    (dlTimestamps ?? []).map((r) => r.downloaded_at),
  );

  const topPages = Object.entries(
    ((pagesRaw ?? []) as { path: string }[]).reduce<Record<string, number>>(
      (acc, { path }) => {
        acc[path] = (acc[path] ?? 0) + 1;
        return acc;
      },
      {},
    ),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const statCards = [
    { label: "total views", value: totalViews ?? 0 },
    { label: "views today", value: viewsToday ?? 0 },
    { label: "views / 7d", value: viewsWeek ?? 0 },
    { label: "total downloads", value: totalDownloads },
    { label: "downloads today", value: dlsToday ?? 0 },
    { label: "published", value: publishedCount },
    { label: "drafts", value: draftCount },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg uppercase tracking-widest">// stats</h1>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {statCards.map(({ label, value }) => (
          <div key={label} className="border border-lime-term/30 p-3">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-lime-dim">
              {label}
            </div>
            <div className="text-xl">{value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <BarChart data={viewsByDay} label="// page views — last 14 days" />
        <BarChart data={dlsByDay} label="// downloads — last 14 days" />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="border border-lime-term/30 p-4">
          <h2 className="mb-3 text-xs uppercase tracking-widest text-lime-dim">
            // top macros (all time)
          </h2>
          {(topMacros ?? []).length === 0 ? (
            <p className="text-xs text-lime-dim">&gt; no data yet</p>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {(topMacros ?? []).map((m, i) => (
                  <tr key={m.slug} className="border-b border-lime-term/10">
                    <td className="py-1.5 pr-2 text-lime-dim">{i + 1}</td>
                    <td className="py-1.5">{m.name}</td>
                    <td className="py-1.5 pl-2 text-right text-lime-dim">
                      {m.download_count} dl
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border border-lime-term/30 p-4">
          <h2 className="mb-3 text-xs uppercase tracking-widest text-lime-dim">
            // top pages (7d)
          </h2>
          {topPages.length === 0 ? (
            <p className="text-xs text-lime-dim">&gt; no data yet</p>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {topPages.map(([path, count], i) => (
                  <tr key={path} className="border-b border-lime-term/10">
                    <td className="py-1.5 pr-2 text-lime-dim">{i + 1}</td>
                    <td className="py-1.5">{path}</td>
                    <td className="py-1.5 pl-2 text-right text-lime-dim">
                      {count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="border border-lime-term/30 p-4">
        <h2 className="mb-3 text-xs uppercase tracking-widest text-lime-dim">
          // recent downloads
        </h2>
        {(recentDls ?? []).length === 0 ? (
          <p className="text-xs text-lime-dim">&gt; no downloads yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-lime-term/30">
                <tr>
                  <th className="py-1.5 pr-4 text-left font-normal text-lime-dim">
                    time
                  </th>
                  <th className="py-1.5 pr-4 text-left font-normal text-lime-dim">
                    macro
                  </th>
                  <th className="py-1.5 text-left font-normal text-lime-dim">
                    ip
                  </th>
                </tr>
              </thead>
              <tbody>
                {(recentDls as {
                  downloaded_at: string;
                  ip: string | null;
                  macros: { name: string } | null;
                }[]).map((dl, i) => (
                  <tr key={i} className="border-b border-lime-term/10">
                    <td className="py-1.5 pr-4 text-lime-dim">
                      {new Date(dl.downloaded_at).toLocaleString()}
                    </td>
                    <td className="py-1.5 pr-4">{dl.macros?.name ?? "—"}</td>
                    <td className="py-1.5 text-lime-dim">{dl.ip ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
