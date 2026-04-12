"use server";

import { createClient } from "@/lib/supabase-server";

export interface FeedbackSubmission {
  message: string;
  category?: "bug" | "idea" | "praise" | "other";
  userAgent?: string;
}

export async function submitFeedback(data: FeedbackSubmission) {
  const message = data.message?.trim();
  if (!message) return { error: "Message is required" };
  if (message.length < 5) return { error: "Feedback is too short" };
  if (message.length > 2000) return { error: "Feedback is too long" };

  const supabase = await createClient();
  if (!supabase) return { error: "Not configured" };

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    email: user?.email ?? null,
    message,
    category: data.category ?? "other",
    status: "pending",
    user_agent: data.userAgent?.slice(0, 500) ?? null,
  });

  if (error) return { error: error.message };
  return { success: true };
}
