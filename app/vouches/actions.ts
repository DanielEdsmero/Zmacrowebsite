"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function submitVouch(
  formData: FormData,
): Promise<{ success?: true; error?: string }> {
  const image_url = formData.get("image_url")?.toString().trim();
  const macro_id = formData.get("macro_id")?.toString().trim() || null;
  const caption = formData.get("caption")?.toString().trim().slice(0, 300) || null;
  const raw_name = formData.get("author_name")?.toString().trim();
  const author_name = raw_name && raw_name.length > 0 ? raw_name.slice(0, 50) : "Anonymous";

  if (!image_url) return { error: "Missing image." };

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const supabase = createAdminClient();
  const { error } = await supabase.from("vouches").insert({
    image_url,
    macro_id,
    caption,
    author_name,
    ip,
  });

  if (error) return { error: error.message };

  revalidatePath("/vouches");
  revalidatePath("/");
  return { success: true };
}
