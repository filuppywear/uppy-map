"use server";

import { createClient } from "@/lib/supabase-server";

export async function toggleStoreFavorite(storeId: number) {
  const supabase = await createClient();
  if (!supabase) return { error: "Not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check if already favorited
  const { data: existing } = await supabase
    .from("store_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (existing) {
    await supabase.from("store_favorites").delete().eq("id", existing.id);
    return { favorited: false };
  }

  await supabase
    .from("store_favorites")
    .insert({ user_id: user.id, store_id: storeId });
  return { favorited: true };
}

export async function getUserFavoriteIds(): Promise<number[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("store_favorites")
    .select("store_id")
    .eq("user_id", user.id);

  return data?.map((row) => row.store_id) ?? [];
}
