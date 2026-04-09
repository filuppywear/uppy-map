import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

// Simple in-memory rate limiter (per serverless instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const { email, phone, role, source } = body as {
      email?: string;
      phone?: string;
      role?: string;
      source?: string;
    };

    const normalizedEmail = email?.toLowerCase().trim() || "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const validRoles = ["buyer", "seller", "store_owner"];
    const cleanRole = validRoles.includes(role || "") ? role : "buyer";
    const cleanSource =
      typeof source === "string" && source.trim() ? source.trim() : "thrifter_map_beta";

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Waitlist storage is not configured" },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from("waitlist").upsert(
      {
        email: normalizedEmail,
        phone: phone?.trim() || null,
        role: cleanRole,
        source: cleanSource,
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("Supabase waitlist error:", error.message);
      return NextResponse.json(
        { error: "Could not save waitlist entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
