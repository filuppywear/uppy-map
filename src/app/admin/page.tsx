"use client";

import { useEffect, useState } from "react";
import { isAdmin, getPendingProposals, approveProposal, rejectProposal } from "@/actions/admin";
import PageHeader from "@/components/PageHeader";

interface PendingProposal {
  id: string;
  type: string;
  store_id: number | null;
  name: string | null;
  description: string | null;
  category: string | null;
  city: string | null;
  country: string | null;
  reason: string | null;
  created_at: string;
  submitter: { username: string | null; full_name: string | null };
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<PendingProposal[]>([]);
  const [actionNote, setActionNote] = useState("");

  useEffect(() => {
    void isAdmin().then((ok) => {
      setAuthorized(ok);
      if (ok) void getPendingProposals().then((data) => { setProposals(data as PendingProposal[]); setLoading(false); });
      else setLoading(false);
    });
  }, []);

  const handleApprove = async (id: string) => {
    const result = await approveProposal(id, actionNote);
    if ("success" in result) {
      setProposals((prev) => prev.filter((p) => p.id !== id));
      setActionNote("");
    }
  };

  const handleReject = async (id: string) => {
    const result = await rejectProposal(id, actionNote);
    if ("success" in result) {
      setProposals((prev) => prev.filter((p) => p.id !== id));
      setActionNote("");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#302020" }}><p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Loading...</p></div>;
  }

  if (!authorized) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#302020" }}><p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Not authorized.</p></div>;
  }

  return (
    <div className="min-h-screen" style={{ background: "#302020" }}>
      <PageHeader activePage="map" />
      <div className="max-w-3xl mx-auto p-6 pt-8">
        <h1 className="font-bold uppercase mb-2" style={{ fontSize: "16px", letterSpacing: "0.08em", color: "#fff" }}>Admin — Moderation</h1>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }} className="mb-8">{proposals.length} pending proposals</p>

        {proposals.length === 0 ? (
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }} className="text-center py-12">All clear. No pending proposals.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {proposals.map((p) => (
              <div key={p.id} className="p-5" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold uppercase" style={{ fontSize: "9px", letterSpacing: "0.12em", color: "#A58277" }}>{p.type.replace(/_/g, " ")}</span>
                  {p.store_id && <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>Store #{p.store_id}</span>}
                </div>

                {p.name && <div className="font-bold mb-1" style={{ fontSize: "14px", color: "#fff" }}>{p.name}</div>}
                {p.city && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{p.city}{p.country ? `, ${p.country}` : ""}</div>}
                {p.category && <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>Category: {p.category}</div>}
                {p.description && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>{p.description}</div>}
                {p.reason && <div style={{ fontSize: "11px", color: "rgba(220,80,80,0.8)", marginTop: "6px" }}>Reason: {p.reason}</div>}

                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "8px" }}>
                  By: {p.submitter.username || p.submitter.full_name || "Anonymous"} • {new Date(p.created_at).toLocaleDateString()}
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="text"
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="Note (optional)"
                    className="flex-1 px-3 py-2 outline-none"
                    style={{ fontSize: "11px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                  />
                  <button type="button" onClick={() => handleApprove(p.id)} style={{ fontSize: "10px", letterSpacing: "0.1em", background: "rgba(100,220,100,0.2)", border: "1px solid rgba(100,220,100,0.4)", color: "rgba(100,220,100,0.9)", padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}>
                    APPROVE
                  </button>
                  <button type="button" onClick={() => handleReject(p.id)} style={{ fontSize: "10px", letterSpacing: "0.1em", background: "rgba(220,80,80,0.1)", border: "1px solid rgba(220,80,80,0.3)", color: "rgba(220,80,80,0.8)", padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}>
                    REJECT
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
