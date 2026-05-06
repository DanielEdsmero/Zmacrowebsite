import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Returns a signed upload URL so the client can PUT large files directly
// to Supabase Storage, bypassing the Next.js API route body limit.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    return NextResponse.json({ error: "not authorized" }, { status: 401 });
  }

  const { filename } = await request.json();
  if (!filename || typeof filename !== "string") {
    return NextResponse.json({ error: "filename required" }, { status: 400 });
  }

  const ext = filename.match(/\.[A-Za-z0-9]+$/)?.[0].toLowerCase() ?? "";
  const path = `uploads/${crypto.randomUUID()}${ext}`;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("files")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[upload-url]", error?.message);
    return NextResponse.json({ error: "could not create upload url" }, { status: 500 });
  }

  return NextResponse.json({ path, signedUrl: data.signedUrl });
}
