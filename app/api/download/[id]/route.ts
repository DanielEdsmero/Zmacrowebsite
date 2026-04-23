import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BUCKET = "files";
const SIGNED_URL_TTL_SECONDS = 60;

async function handle(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createAdminClient();

  const { data: macro, error } = await supabase
    .from("macros")
    .select("id, file_path, published")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !macro || !macro.published) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(macro.file_path, SIGNED_URL_TTL_SECONDS, {
      download: true,
    });

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "could not sign url" },
      { status: 500 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent");

  // Fire-and-forget: we don't block the redirect on logging failures.
  await Promise.all([
    supabase.from("download_logs").insert({
      macro_id: macro.id,
      ip,
      user_agent: userAgent,
    }),
    supabase.rpc("increment_download_count", { p_macro_id: macro.id }).then(
      async ({ error: rpcErr }) => {
        if (!rpcErr) return;
        // Fallback if the RPC isn't defined: read-modify-write. Race-prone
        // but acceptable for a low-traffic download counter.
        const { data: row } = await supabase
          .from("macros")
          .select("download_count")
          .eq("id", macro.id)
          .single();
        if (row) {
          await supabase
            .from("macros")
            .update({ download_count: (row.download_count ?? 0) + 1 })
            .eq("id", macro.id);
        }
      },
    ),
  ]);

  return NextResponse.redirect(signed.signedUrl, 303);
}

export const GET = handle;
export const POST = handle;
