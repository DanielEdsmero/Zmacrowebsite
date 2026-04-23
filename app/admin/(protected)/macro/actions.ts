"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";

async function assertAdmin() {
  const supabase = createClient();
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

function file(formData: FormData, key: string): File | null {
  const v = formData.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}

function files(formData: FormData, key: string): File[] {
  return formData
    .getAll(key)
    .filter((v): v is File => v instanceof File && v.size > 0);
}

function extOf(f: File): string {
  const m = f.name.match(/\.[A-Za-z0-9]+$/);
  return m ? m[0].toLowerCase() : "";
}

function randomPath(prefix: string, f: File): string {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}/${id}${extOf(f)}`;
}

async function uploadToBucket(
  bucket: "covers" | "screenshots" | "files",
  f: File,
  pathPrefix: string,
): Promise<{ path: string; publicUrl: string | null }> {
  const admin = createAdminClient();
  const path = randomPath(pathPrefix, f);
  const { error } = await admin.storage.from(bucket).upload(path, f, {
    cacheControl: "3600",
    upsert: false,
    contentType: f.type || undefined,
  });
  if (error) throw new Error(`upload failed (${bucket}): ${error.message}`);

  const publicUrl =
    bucket === "files"
      ? null
      : admin.storage.from(bucket).getPublicUrl(path).data.publicUrl;

  return { path, publicUrl };
}

type MacroInput = {
  name: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  version: string;
  price_usd: number;
  published: boolean;
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

  return {
    name,
    slug,
    short_description,
    long_description,
    version,
    price_usd,
    published,
  };
}

export async function createMacroAction(formData: FormData) {
  await assertAdmin();
  const fields = readFields(formData);

  const coverFile = file(formData, "cover");
  const screenshotFiles = files(formData, "screenshots");
  const macroFile = file(formData, "macro_file");

  if (!macroFile) throw new Error("macro file is required");

  const { path: filePath } = await uploadToBucket(
    "files",
    macroFile,
    "uploads",
  );

  let coverUrl: string | null = null;
  if (coverFile) {
    const uploaded = await uploadToBucket("covers", coverFile, "uploads");
    coverUrl = uploaded.publicUrl;
  }

  const screenshotUrls: string[] = [];
  for (const sf of screenshotFiles) {
    const uploaded = await uploadToBucket("screenshots", sf, "uploads");
    if (uploaded.publicUrl) screenshotUrls.push(uploaded.publicUrl);
  }

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

  const coverFile = file(formData, "cover");
  const screenshotFiles = files(formData, "screenshots");
  const macroFile = file(formData, "macro_file");

  let coverUrl: string | null = existing.cover_url;
  if (coverFile) {
    const uploaded = await uploadToBucket("covers", coverFile, "uploads");
    coverUrl = uploaded.publicUrl;
  }

  let filePath: string = existing.file_path;
  if (macroFile) {
    const uploaded = await uploadToBucket("files", macroFile, "uploads");
    filePath = uploaded.path;
  }

  // Screenshots: if new ones uploaded, replace the whole array. Otherwise
  // keep the existing ones. (Keeps the UI simple; replacement is the common
  // edit pattern.)
  let screenshotUrls: string[] = (existing.screenshots as string[]) ?? [];
  if (screenshotFiles.length > 0) {
    screenshotUrls = [];
    for (const sf of screenshotFiles) {
      const uploaded = await uploadToBucket(
        "screenshots",
        sf,
        "uploads",
      );
      if (uploaded.publicUrl) screenshotUrls.push(uploaded.publicUrl);
    }
  }

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
