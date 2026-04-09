"use server";

import { createClient } from "@/lib/supabase-server";

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  created_at: string;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}

export async function upsertProfile(
  updates: Partial<Pick<Profile, "username" | "full_name" | "phone" | "avatar_url" | "bio" | "role">>
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("profiles").upsert(
    { id: user.id, ...updates },
    { onConflict: "id" }
  );

  if (error) return { error: error.message };
  return { success: true };
}
