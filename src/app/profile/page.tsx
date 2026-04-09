"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, upsertProfile, type Profile } from "@/actions/profile";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";

export default function ProfilePage() {
  const { user, isLoggedIn, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", full_name: "", phone: "", bio: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    void getProfile().then((p) => {
      if (p) {
        setProfile(p);
        setForm({
          username: p.username ?? "",
          full_name: p.full_name ?? "",
          phone: p.phone ?? "",
          bio: p.bio ?? "",
        });
      }
    });
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#302020" }}>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: "#302020" }}>
        <Image src="/branding/logo-white.svg" alt="Uppy" width={80} height={28} style={{ filter: "brightness(10)" }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Sign in to view your profile.</p>
        <Link href="/" className="text-sm font-bold uppercase tracking-wider px-6 py-3" style={{ background: "#fff", color: "#302020", textDecoration: "none" }}>
          Go to map
        </Link>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const result = await upsertProfile(form);
    if (!("error" in result)) {
      setProfile((prev) => prev ? { ...prev, ...form } : prev);
      setEditing(false);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "#302020" }}>
      <PageHeader activePage="map" />
      <div className="max-w-lg mx-auto px-4 md:px-6 py-6 md:pt-8">

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#fff" }}>
              {profile?.full_name || profile?.username || user?.email?.split("@")[0] || "User"}
            </h1>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{user?.email}</p>
            {profile?.role && (
              <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)" }}>
                {profile.role}
              </span>
            )}
          </div>
        </div>

        {!editing ? (
          <div className="flex flex-col gap-4">
            {profile?.bio && (
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{profile.bio}</p>
            )}
            {profile?.phone && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Phone: {profile.phone}</p>
            )}
            <button onClick={() => setEditing(true)} className="action-icon self-start px-4 py-2 text-xs font-bold uppercase tracking-[0.1em]" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)", background: "transparent", cursor: "pointer" }}>
              Edit profile
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username" className="w-full h-11 px-4 text-sm outline-none" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" className="w-full h-11 px-4 text-sm outline-none" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" className="w-full h-11 px-4 text-sm outline-none" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" rows={3} className="w-full px-4 py-3 text-sm outline-none resize-none" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider" style={{ background: "#fff", color: "#302020", border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditing(false)} className="action-icon px-4 py-2.5 text-xs font-bold uppercase tracking-wider" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)", background: "transparent", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="mt-10 flex flex-col gap-3">
          <Link href="/proposals" className="header-btn flex items-center gap-2 font-bold uppercase" style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            My proposals
          </Link>
          <Link href="/leaderboard" className="header-btn flex items-center gap-2 font-bold uppercase" style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
            Leaderboard
          </Link>
          <Link href="/favorites" className="header-btn flex items-center gap-2 font-bold uppercase" style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            My favorites
          </Link>
        </div>

        <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={signOut} className="action-icon font-bold uppercase px-4 py-2" style={{ fontSize: "10px", letterSpacing: "0.1em", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.3)", background: "transparent", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
