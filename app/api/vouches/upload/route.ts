import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "only jpg, png, webp, gif allowed" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "max file size is 5 MB" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Auto-create bucket on first use (noop if already exists)
  await admin.storage.createBucket("vouches", { public: true }).catch(() => {});

  const ext = file.name.match(/\.[A-Za-z0-9]+$/)?.[0].toLowerCase() ?? ".jpg";
  const path = `uploads/${crypto.randomUUID()}${ext}`;

  const { error } = await admin.storage.from("vouches").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicUrl = admin.storage.from("vouches").getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ publicUrl });
}
