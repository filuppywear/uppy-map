"use server";

import { createClient } from "@/lib/supabase-server";

export interface StoreSubmission {
  store_id?: number | null;
  name: string;
  description?: string;
  category?: string;
  city?: string;
  country?: string;
  address?: string;
  website?: string;
  instagram?: string;
  lat?: number | null;
  lng?: number | null;
  images?: string[];
}

export async function submitStore(data: StoreSubmission) {
  const supabase = await createClient();
  if (!supabase) return { error: "Not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("submissions").insert({
    user_id: user.id,
    store_id: data.store_id ?? null,
    name: data.name,
    description: data.description ?? null,
    category: data.category ?? null,
    city: data.city ?? null,
    country: data.country ?? null,
    address: data.address ?? null,
    website: data.website ?? null,
    instagram: data.instagram ?? null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    images: data.images ?? [],
    status: "pending",
  });

  if (error) return { error: error.message };
  return { success: true };
}
