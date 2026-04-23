import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_BUCKETS = ["covers", "screenshots", "files"] as const;
type Bucket = (typeof ALLOWED_BUCKETS)[number];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    return NextResponse.json({ error: "not authorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const bucket = formData.get("bucket") as Bucket;

  if (!(file instanceof File) || !ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const ext = file.name.match(/\.[A-Za-z0-9]+$/)?.[0].toLowerCase() ?? "";
  const id = crypto.randomUUID();
  const path = `uploads/${id}${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    console.error(`[upload] bucket=${bucket} path=${path} error=${error.message}`);
    return NextResponse.json({ error: `storage error (${bucket}): ${error.message}` }, { status: 500 });
  }

  const publicUrl =
    bucket === "files"
      ? null
      : admin.storage.from(bucket).getPublicUrl(path).data.publicUrl;

  return NextResponse.json({ path, publicUrl });
}
