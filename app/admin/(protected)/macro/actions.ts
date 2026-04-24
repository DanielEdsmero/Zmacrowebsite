"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (
    !user ||
    !adminEmail ||
    user.email?.toLowerCase() !== adminEmail.toLowerCase()
  ) {
    throw new Error("not authorized");
  }
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

type MacroInput = {
  name: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  version: string;
  price_usd: number;
  published: boolean;
  github_url: string | null;
  cover_url?: string | null;
  file_path?: string;
  screenshots?: string[];
};

function readFields(formData: FormData): Omit<MacroInput, "cover_url" | "file_path" | "screenshots"> {
  const name = str(formData, "name").trim();
  const slug = (str(formData, "slug").trim() || slugify(name));
  const short_description = str(formData, "short_description").trim();
  const long_description = str(formData, "long_description").trim() || null;
  const version = str(formData, "version").trim();
  const priceRaw = str(formData, "price_usd").trim();
  const price_usd = priceRaw === "" ? 0 : Math.max(0, Number(priceRaw));
  const published = formData.get("published") === "on";

  if (!name) throw new Error("name is required");
  if (!slug) throw new Error("slug is required");
  if (!short_description) throw new Error("short description is required");
  if (short_description.length > 200)
    throw new Error("short description must be 200 characters or fewer");
  if (!version) throw new Error("version is required");
  if (!Number.isFinite(price_usd))
    throw new Error("price must be a number");

  const github_url = str(formData, "github_url").trim() || null;

  return {
    name,
    slug,
    short_description,
    long_description,
    version,
    price_usd,
    published,
    github_url,
  };
}

export async function createMacroAction(formData: FormData) {
  try {
  await assertAdmin();
  const fields = readFields(formData);

  const filePath = str(formData, "file_path").trim();
  if (!filePath) throw new Error("macro file is required");

  const coverUrl = str(formData, "cover_url").trim() || null;
  const screenshotUrls = formData
    .getAll("screenshot_url")
    .map((v) => String(v))
    .filter(Boolean);

  const admin = createAdminClient();
  const { error } = await admin.from("macros").insert({
    ...fields,
    cover_url: coverUrl,
    file_path: filePath,
    screenshots: screenshotUrls,
  });

  if (error) throw new Error(`insert failed: ${error.message}`);

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("[createMacroAction]", err);
    throw err;
  }
}

export async function updateMacroAction(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) throw new Error("id is required");

  const fields = readFields(formData);
  const admin = createAdminClient();

  const { data: existing, error: loadErr } = await admin
    .from("macros")
    .select("cover_url, file_path, screenshots")
    .eq("id", id)
    .maybeSingle();
  if (loadErr || !existing) throw new Error("macro not found");

  const newCoverUrl = str(formData, "cover_url").trim();
  const coverUrl: string | null = newCoverUrl || existing.cover_url;

  const newFilePath = str(formData, "file_path").trim();
  const filePath: string = newFilePath || existing.file_path;

  const newScreenshotUrls = formData
    .getAll("screenshot_url")
    .map((v) => String(v))
    .filter(Boolean);
  const screenshotUrls: string[] =
    newScreenshotUrls.length > 0
      ? newScreenshotUrls
      : (existing.screenshots as string[]) ?? [];

  const { error } = await admin
    .from("macros")
    .update({
      ...fields,
      cover_url: coverUrl,
      file_path: filePath,
      screenshots: screenshotUrls,
    })
    .eq("id", id);

  if (error) throw new Error(`update failed: ${error.message}`);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/macro/${fields.slug}`);
  redirect("/admin");
}

export async function deleteMacroAction(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) throw new Error("id is required");

  const admin = createAdminClient();
  const { error } = await admin.from("macros").delete().eq("id", id);
  if (error) throw new Error(`delete failed: ${error.message}`);

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}
