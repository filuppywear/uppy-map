"use server";

import { createClient } from "@/lib/supabase-server";

export interface Proposal {
  id: string;
  user_id: string;
  type: "new_store" | "edit_store" | "remove_store";
  store_id: number | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  name: string | null;
  description: string | null;
  category: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  website: string | null;
  instagram: string | null;
  lat: number | null;
  lng: number | null;
  reason: string | null;
  reviewer_note: string | null;
  created_at: string;
}

export interface NewStoreData {
  name: string;
  description?: string;
  category?: string;
  city?: string;
  country?: string;
  address?: string;
  website?: string;
  instagram?: string;
  lat?: number;
  lng?: number;
}

export async function submitNewStoreProposal(data: NewStoreData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!data.name?.trim()) return { error: "Store name is required" };

  const { error } = await supabase.from("store_proposals").insert({
    user_id: user.id,
    type: "new_store",
    status: "pending",
    name: data.name.trim(),
    description: data.description?.trim() || null,
    category: data.category || null,
    city: data.city?.trim() || null,
    country: data.country?.trim() || null,
    address: data.address?.trim() || null,
    website: data.website?.trim() || null,
    instagram: data.instagram?.trim() || null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function submitEditProposal(storeId: number, data: NewStoreData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("store_proposals").insert({
    user_id: user.id,
    type: "edit_store",
    store_id: storeId,
    status: "pending",
    name: data.name?.trim() || null,
    description: data.description?.trim() || null,
    category: data.category || null,
    city: data.city?.trim() || null,
    country: data.country?.trim() || null,
    address: data.address?.trim() || null,
    website: data.website?.trim() || null,
    instagram: data.instagram?.trim() || null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function submitRemovalProposal(storeId: number, reason: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!reason?.trim()) return { error: "Reason is required" };

  const { error } = await supabase.from("store_proposals").insert({
    user_id: user.id,
    type: "remove_store",
    store_id: storeId,
    status: "pending",
    reason: reason.trim(),
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function cancelProposal(proposalId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Only cancel own pending proposals
  const { data: proposal } = await supabase
    .from("store_proposals")
    .select("id, user_id, status")
    .eq("id", proposalId)
    .maybeSingle();

  if (!proposal) return { error: "Proposal not found" };
  if (proposal.user_id !== user.id) return { error: "Not your proposal" };
  if (proposal.status !== "pending") return { error: "Can only cancel pending proposals" };

  const { error } = await supabase
    .from("store_proposals")
    .update({ status: "cancelled" })
    .eq("id", proposalId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function getMyProposals(): Promise<Proposal[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("store_proposals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as Proposal[];
}

export interface LeaderboardEntry {
  user_id: string;
  points: number;
  approved_count: number;
  username: string | null;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("leaderboard")
    .select("user_id, points, approved_count")
    .limit(50);

  if (!data || data.length === 0) return [];

  const userIds = data.map((e) => e.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p.username]) ?? []);

  return data.map((e) => ({
    ...e,
    username: profileMap.get(e.user_id) ?? null,
  }));
}
