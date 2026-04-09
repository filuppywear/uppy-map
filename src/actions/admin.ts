"use server";

import { createClient } from "@/lib/supabase-server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "fil@uppy.style,filippo@uppy.market").split(",").map(e => e.trim());

async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Not configured");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) throw new Error("Not authorized");

  return { supabase, user };
}

export async function isAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function getPendingProposals() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("store_proposals")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!data || data.length === 0) return [];

  const userIds = [...new Set(data.map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, { username: p.username, full_name: p.full_name }]) ?? []);

  return data.map((p) => ({
    ...p,
    submitter: profileMap.get(p.user_id) ?? { username: null, full_name: null },
  }));
}

export async function approveProposal(proposalId: string, note?: string) {
  const { supabase, user } = await requireAdmin();

  const { error } = await supabase
    .from("store_proposals")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reviewer_note: note || null,
    })
    .eq("id", proposalId)
    .eq("status", "pending");

  if (error) return { error: error.message };
  return { success: true };
}

export async function rejectProposal(proposalId: string, note?: string) {
  const { supabase, user } = await requireAdmin();

  const { error } = await supabase
    .from("store_proposals")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reviewer_note: note || null,
    })
    .eq("id", proposalId)
    .eq("status", "pending");

  if (error) return { error: error.message };
  return { success: true };
}

export async function getPendingReviews() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("store_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}
