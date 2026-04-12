"use server";

import { createClient } from "@/lib/supabase-server";

export async function uploadStorePhoto(storeId: number, formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("photo") as File | null;
  if (!file || !(file instanceof File)) return { error: "No file provided" };

  if (!file.type.startsWith("image/")) return { error: "File must be an image" };
  if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5 MB" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `stores/${storeId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);

  // Record in store_photos table for moderation
  await supabase.from("store_photos").insert({
    store_id: storeId,
    user_id: user.id,
    url: urlData.publicUrl,
    status: "pending",
  });

  // Award points
  await supabase.rpc("award_points", { p_user_id: user.id, p_amount: 3, p_reason: "photo_upload" });

  return { url: urlData.publicUrl };
}
