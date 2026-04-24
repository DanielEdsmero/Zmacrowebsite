"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function submitReview(
  formData: FormData
): Promise<{ success?: true; error?: string }> {
  const macro_id = formData.get("macro_id")?.toString().trim();
  const macro_slug = formData.get("macro_slug")?.toString().trim();
  const raw_name = formData.get("author_name")?.toString().trim();
  const author_name = raw_name && raw_name.length > 0 ? raw_name.slice(0, 50) : "Anonymous";
  const rating = Number(formData.get("rating"));
  const body = formData.get("body")?.toString().trim() || null;
  const safety_vote = formData.get("safety_vote")?.toString() || null;

  if (!macro_id) return { error: "Missing macro." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { error: "Pick a star rating (1–5)." };
  if (body && body.length > 1000)
    return { error: "Review too long (max 1000 chars)." };
  if (safety_vote && !["safe", "virus", "unsure"].includes(safety_vote))
    return { error: "Invalid safety vote." };

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const supabase = createAdminClient();
  const { error } = await supabase.from("reviews").insert({
    macro_id,
    author_name,
    rating,
    body,
    safety_vote,
    ip,
  });

  if (error) return { error: error.message };

  if (macro_slug) revalidatePath(`/macro/${macro_slug}`);
  revalidatePath("/");
  return { success: true };
}
