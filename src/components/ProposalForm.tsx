"use client";

import { useState } from "react";
import { submitNewStoreProposal, submitEditProposal, submitRemovalProposal } from "@/actions/proposals";
import { CATEGORIES } from "@/lib/types";
import type { Store } from "@/lib/types";

interface Props {
  mode: "new" | "edit" | "remove";
  store?: Store | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProposalForm({ mode, store, onClose, onSuccess }: Props) {
  const [name, setName] = useState(store?.name ?? "");
  const [description, setDescription] = useState(store?.description ?? "");
  const [category, setCategory] = useState(store?.category ?? "");
  const [city, setCity] = useState(store?.city ?? "");
  const [country, setCountry] = useState(store?.country ?? "");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState(store?.website ?? "");
  const [instagram, setInstagram] = useState(store?.instagram ?? "");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    let result;

    if (mode === "remove") {
      if (!reason.trim()) { setError("Please provide a reason"); setSubmitting(false); return; }
      result = await submitRemovalProposal(store!.id, reason);
    } else if (mode === "edit") {
      const fields = { name, description, category, city, country, address, website, instagram };
      const hasChange = Object.entries(fields).some(([k, v]) => {
        const orig = (store as unknown as Record<string, unknown>)?.[k] ?? "";
        return String(v).trim() !== String(orig).trim();
      });
      if (!hasChange) { setError("Change at least one field"); setSubmitting(false); return; }
      result = await submitEditProposal(store!.id, fields);
    } else {
      if (!name.trim()) { setError("Store name is required"); setSubmitting(false); return; }
      result = await submitNewStoreProposal({ name, description, category, city, country, address, website, instagram });
    }

    setSubmitting(false);
    if ("error" in result) { setError(result.error ?? "Unknown error"); return; }
    onSuccess();
  };

  const title = mode === "new" ? "Propose a new store" : mode === "edit" ? `Edit: ${store?.name}` : `Remove: ${store?.name}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(18,12,12,0.75)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto px-5 py-7 sm:px-7 sm:py-8" style={{ background: "#302020" }} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="header-btn absolute top-2 right-2 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        <h2 className="font-bold uppercase mb-4" style={{ fontSize: "14px", letterSpacing: "0.08em", color: "#fff" }}>{title}</h2>

        {mode === "remove" ? (
          <div className="flex flex-col gap-3">
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: "1.5" }}>
              Explain why this store should be removed. Your proposal will be reviewed by our team.
            </p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for removal" rows={4} className="w-full px-3 py-2 outline-none resize-none" style={{ fontSize: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Store name *" className="w-full px-3 py-2 outline-none" style={{ fontSize: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 outline-none" style={{ fontSize: "12px", background: "#302020", border: "1px solid rgba(255,255,255,0.15)", color: category ? "#fff" : "rgba(255,255,255,0.4)" }}>
              <option value="">Category</option>
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full px-3 py-2 outline-none" style={{ fontSize: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
              <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className="w-full px-3 py-2 outline-none" style={{ fontSize: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
            </div>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="w-full px-3 py-2 outline-none" style={{ fontSize: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className="w-full px-3 py-2 outline-none resize-none" style={{ fontSize: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website (optional)" className="w-full px-3 py-2 outline-none" style={{ fontSize: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
              <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram (optional)" className="w-full px-3 py-2 outline-none" style={{ fontSize: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
            </div>
          </div>
        )}

        {error && <p style={{ fontSize: "11px", color: "rgba(220,80,80,0.8)", marginTop: "8px" }}>{error}</p>}

        <div className="flex gap-2 mt-5">
          <button type="button" onClick={handleSubmit} disabled={submitting} style={{ fontSize: "10px", letterSpacing: "0.1em", background: "#fff", color: "#302020", border: "none", padding: "10px 24px", cursor: submitting ? "default" : "pointer", fontWeight: 700, opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Submitting..." : "Submit proposal"}
          </button>
          <button type="button" onClick={onClose} className="action-icon" style={{ fontSize: "10px", letterSpacing: "0.1em", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)", background: "transparent", padding: "10px 16px", cursor: "pointer", fontWeight: 700 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
