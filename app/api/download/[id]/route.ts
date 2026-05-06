import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BUCKET = "files";
const SIGNED_URL_TTL_SECONDS = 60;

async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: macro, error } = await supabase
    .from("macros")
    .select("id, file_path, published, is_premium")
    .eq("id", id)
    .maybeSingle();

  if (error || !macro || !macro.published) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Premium macros require a valid purchase token
  if (macro.is_premium) {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "purchase required" }, { status: 402 });
    }

    const { data: purchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("macro_id", macro.id)
      .eq("download_token", token)
      .maybeSingle();

    if (!purchase) {
      return NextResponse.json({ error: "invalid or expired token" }, { status: 403 });
    }
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

  await Promise.all([
    supabase.from("download_logs").insert({
      macro_id: macro.id,
      ip,
      user_agent: userAgent,
    }),
    supabase.rpc("increment_download_count", { p_macro_id: macro.id }).then(
      async ({ error: rpcErr }) => {
        if (!rpcErr) return;
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
