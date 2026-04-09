"use server";

import { createClient } from "@/lib/supabase-server";

export interface Review {
  id: string;
  store_id: number;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  username: string | null;
}

export async function getStoreReviews(storeId: number): Promise<Review[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("store_reviews")
    .select("id, store_id, user_id, rating, comment, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (!data || data.length === 0) return [];

  const userIds = [...new Set(data.map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p.username]) ?? []);

  return data.map((r) => ({
    ...r,
    username: profileMap.get(r.user_id) ?? null,
  }));
}

export async function getMyReview(storeId: number) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("store_reviews")
    .select("id, rating, comment")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

export async function submitReview(storeId: number, rating: number, comment: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (rating < 1 || rating > 5) return { error: "Rating must be 1-5" };

  // Check if review exists
  const { data: existing } = await supabase
    .from("store_reviews")
    .select("id")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("store_reviews")
      .update({ rating, comment: comment || null })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("store_reviews")
      .insert({ store_id: storeId, user_id: user.id, rating, comment: comment || null });
    if (error) return { error: error.message };
  }

  return { success: true };
}
