"use client";

import { useState, useCallback } from "react";
import { upsertProfile } from "@/actions/profile";

interface Props {
  onComplete: () => void;
  defaultName?: string;
}

export default function ProfileSetup({ onComplete, defaultName }: Props) {
  const [name, setName] = useState(defaultName ?? "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    setError(""); setSaving(true);

    const result = await upsertProfile({
      full_name: name.trim(),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
    });

    if ("error" in result) {
      setError(result.error || "Failed to save");
      setSaving(false);
      return;
    }

    onComplete();
  }, [name, phone, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "var(--overlay-light)", backdropFilter: "blur(16px)" }}
    >
      <div
        className="relative w-full sm:max-w-sm overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        style={{ background: "#2D2323", boxShadow: "0 -20px 60px rgba(0,0,0,0.5)" }}
      >
        <div className="px-7 py-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "#A58277" }}>
            Almost there
          </div>
          <h2
            className="text-[1.75rem] font-bold uppercase tracking-[-0.04em] mb-2 leading-[1.15]"
            style={{ fontFamily: "'Montserrat', var(--font-display)", color: "#fff" }}
          >
            What should we call you?
          </h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Just your name. Phone is optional — we&apos;ll only use it if you want notifications.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
                autoFocus
                className="w-full h-11 px-4 outline-none text-sm"
                style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.35)", color: "#fff" }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Phone <span style={{ color: "rgba(255,255,255,0.25)" }}>(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+39 333 1234567"
                className="w-full h-11 px-4 outline-none text-sm"
                style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.2)", color: "#fff" }}
              />
            </div>

            {error && <p className="text-xs" style={{ color: "#E4A08A" }}>{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full h-12 text-sm font-bold uppercase tracking-[0.16em] mt-2"
              style={{ background: "#fff", color: "#2D2323", border: "none", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Saving..." : "Continue to the map"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
